import api from '../utils/apiClient';

/**
 * Dashboard Service
 * Handles fetching real data from your APIs for dashboard analytics
 */
const dashboardService = {
  /**
   * Get all tenants data
   * @returns {Promise<Object>} Tenants data
   */
  getTenants: async () => {
    try {
      const response = await api.get('/tenants');
      return response.data;
    } catch (error) {
      console.error('Get tenants error:', error);
      throw new Error(error.message || 'Failed to fetch tenants');
    }
  },

  /**
   * Get all bookings data
   * @returns {Promise<Object>} Bookings data
   */
  getBookings: async () => {
    try {
      const response = await api.get('/bookings');
      return response.data;
    } catch (error) {
      console.error('Get bookings error:', error);
      throw new Error(error.message || 'Failed to fetch bookings');
    }
  },

  /**
   * Get all rooms data
   * @returns {Promise<Object>} Rooms data
   */
  getRooms: async () => {
    try {
      const response = await api.get('/rooms');
      return response.data;
    } catch (error) {
      console.error('Get rooms error:', error);
      throw new Error(error.message || 'Failed to fetch rooms');
    }
  },
  /**
   * Get all payments data
   * @returns {Promise<Object>} Payments data
   */
  getPayments: async () => {
    try {
      const response = await api.get('/payments');
      return response.data;
    } catch (error) {
      console.error('Get payments error:', error);
      throw new Error(error.message || 'Failed to fetch payments');
    }
  },

  /**
   * Get combined dashboard data
   * @returns {Promise<Object>} Combined dashboard analytics
   */  getDashboardData: async () => {
    try {
      // Fetch all data in parallel
      const [tenantsResponse, bookingsResponse, roomsResponse, paymentsResponse] = await Promise.all([
        dashboardService.getTenants(),
        dashboardService.getBookings(),
        dashboardService.getRooms(),
        dashboardService.getPayments()
      ]);

      const tenants = tenantsResponse.tenants || [];
      const bookings = bookingsResponse.bookings || [];
      const rooms = roomsResponse.rooms || [];
      const payments = paymentsResponse.payments || [];

      // Enhanced debugging for tenant counting
      console.log('=== TENANT COUNT DEBUGGING ===');
      console.log('Raw tenants response:', tenantsResponse);
      console.log('Tenants array length:', tenants.length);
      console.log('API totalCount field:', tenantsResponse.totalCount);
      console.log('Individual tenant IDs and status:', tenants.map(t => ({
        id: t.tenantId || t.tenant_id || t.id,
        name: t.user?.fullName || t.fullName || t.name,
        status: t.status || t.computed_status || 'no_status',
        type: t.tenantType?.name || t.type,
        active: t.status === 'active' || t.computed_status === 'active'
      })));
      
      // Check for data quality issues
      const duplicateNames = tenants.reduce((acc, tenant) => {
        const name = tenant.user?.fullName || tenant.name;
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});
      const duplicatesFound = Object.entries(duplicateNames).filter(([name, count]) => count > 1);
      if (duplicatesFound.length > 0) {
        console.warn('⚠️ DUPLICATE TENANTS IN SERVICE:', duplicatesFound);
      }
      
      // Use API's totalCount if available (most accurate), otherwise use array length
      const totalTenants = tenantsResponse.totalCount || tenants.length;
      console.log('Total tenants calculated:', totalTenants, '(API totalCount:', tenantsResponse.totalCount, ', array length:', tenants.length, ')');
      
      // Enhanced tenant type breakdown with detailed logging
      const mahasiswaTenants = tenants.filter(t => 
        t.tenantType?.name === 'mahasiswa' || t.type === 'mahasiswa'
      );
      const nonMahasiswaTenants = tenants.filter(t => 
        t.tenantType?.name === 'non_mahasiswa' || t.type === 'non_mahasiswa'
      );
      const unknownTypeTenants = tenants.filter(t => 
        !t.tenantType?.name && !t.type
      );
      
      console.log(`Tenant breakdown: ${mahasiswaTenants.length} mahasiswa, ${nonMahasiswaTenants.length} non-mahasiswa, ${unknownTypeTenants.length} unknown type`);
      console.log('Mahasiswa tenants:', mahasiswaTenants.map(t => ({ id: t.tenantId || t.id, name: t.user?.fullName || t.name })));
      console.log('Non-mahasiswa tenants:', nonMahasiswaTenants.map(t => ({ id: t.tenantId || t.id, name: t.user?.fullName || t.name })));
      console.log('Unknown type tenants:', unknownTypeTenants.map(t => ({ id: t.tenantId || t.id, name: t.user?.fullName || t.name, type: t.tenantType, rawType: t.type })));
      console.log('=== END TENANT DEBUGGING ===');
      
      const totalRooms = rooms.length;
      const activeBookings = bookings.filter(booking => 
        booking.status === 'approved' || booking.status === 'confirmed'
      ).length;      // Calculate available rooms - capacity-based logic with proper occupant counting
      // A room is "available" if it has available slots (not at full capacity)
      let availableRooms = 0;
      let occupiedRooms = 0;
      let totalOccupants = 0;
      let totalCapacity = 0;
      
      const currentDate = new Date();
      
      rooms.forEach(room => {
        const capacity = room.capacity || 4;
        totalCapacity += capacity;
        
        let actualOccupants = 0;
        
        // Count occupants from room.occupants array (primary method)
        if (room.occupants && Array.isArray(room.occupants)) {
          // Count approved occupants
          actualOccupants = room.occupants.filter(occupant => 
            occupant.status === 'approved' || occupant.status === 'checked_in'
          ).length;
          console.log(`Room ${room.roomId} (${room.name}): ${actualOccupants} occupants from room.occupants array`);
        }
        
        // Fallback: Count from tenants with currentRoomAssignment
        if (actualOccupants === 0) {
          actualOccupants = tenants.filter(tenant => 
            tenant.currentRoomAssignment?.roomId === room.roomId &&
            // Since status is often empty, include all tenants unless explicitly inactive
            (tenant.status === 'active' || tenant.computed_status === 'active' || (!tenant.status && !tenant.computed_status))
          ).length;
          console.log(`Room ${room.roomId} (${room.name}): ${actualOccupants} occupants from tenant.currentRoomAssignment`);
        }
        
        // Fallback: Count from tenants data if room ID matches
        if (actualOccupants === 0) {
          actualOccupants = tenants.filter(tenant => {
            // Check various possible tenant-room relationships
            const hasRoomId = tenant.roomId === room.roomId;
            const hasCurrentRoom = tenant.current_room?.roomId === room.roomId;
            // Since status is often empty, include all tenants unless explicitly inactive
            const isActiveOrUnknown = tenant.computed_status === 'active' || tenant.status === 'active' || (!tenant.status && !tenant.computed_status);
            
            return (hasRoomId || hasCurrentRoom) && isActiveOrUnknown;
          }).length;
          console.log(`Room ${room.roomId} (${room.name}): ${actualOccupants} occupants from tenant fallback methods`);
        }
        
        totalOccupants += actualOccupants;
        
        // Room classification based on occupancy
        if (actualOccupants === 0) {
          availableRooms++;
          console.log(`Room ${room.roomId} (${room.name}): AVAILABLE (0/${capacity})`);
        } else if (actualOccupants >= capacity) {
          occupiedRooms++;
          console.log(`Room ${room.roomId} (${room.name}): FULLY OCCUPIED (${actualOccupants}/${capacity})`);
        } else {
          // Partially occupied rooms are counted as occupied
          occupiedRooms++;
          console.log(`Room ${room.roomId} (${room.name}): PARTIALLY OCCUPIED (${actualOccupants}/${capacity})`);
        }
      });
      
      console.log(`Dashboard Summary: ${totalOccupants}/${totalCapacity} occupants, ${occupiedRooms} occupied rooms, ${availableRooms} available rooms`);
      console.log(`Occupancy Rate: ${(totalOccupants / totalCapacity * 100).toFixed(1)}%`);// Calculate revenue metrics
      const totalRevenue = payments.reduce((sum, payment) => {
        if (payment.status === 'verified' || payment.status === 'paid' || payment.status === 'completed') {
          return sum + (payment.amount || 0);
        }
        return sum;
      }, 0);

      // Current month revenue
      // Use the currentDate already declared above
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const monthlyRevenue = payments.reduce((sum, payment) => {
        if (payment.status === 'verified' || payment.status === 'paid' || payment.status === 'completed') {
          const paymentDate = new Date(payment.paidAt || payment.createdAt);
          if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
            return sum + (payment.amount || 0);
          }
        }
        return sum;
      }, 0);

      // Payment method distribution
      const paymentMethodDistribution = payments.reduce((acc, payment) => {
        const method = payment.paymentMethod || 'Unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {});

      // Payment channel distribution  
      const paymentChannelDistribution = payments.reduce((acc, payment) => {
        const channel = payment.paymentChannel || 'Unknown';
        acc[channel] = (acc[channel] || 0) + 1;
        return acc;
      }, {});

      // Payment status distribution
      const paymentStatusDistribution = payments.reduce((acc, payment) => {
        const status = payment.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});      // Revenue by payment method
      const revenueByPaymentMethod = payments.reduce((acc, payment) => {
        if (payment.status === 'verified' || payment.status === 'paid' || payment.status === 'completed') {
          const method = payment.paymentMethod || 'Unknown';
          acc[method] = (acc[method] || 0) + (payment.amount || 0);
        }
        return acc;
      }, {});

      // Monthly revenue trend (last 6 months)
      const monthlyRevenueTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();
          const monthRevenue = payments.reduce((sum, payment) => {
          if (payment.status === 'verified' || payment.status === 'paid' || payment.status === 'completed') {
            const paymentDate = new Date(payment.paidAt || payment.createdAt);
            if (paymentDate.getMonth() === month && paymentDate.getFullYear() === year) {
              return sum + (payment.amount || 0);
            }
          }
          return sum;
        }, 0);
        
        monthlyRevenueTrend.push({
          month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          revenue: monthRevenue
        });
      }

      // Gender distribution
      const genderDistribution = tenants.reduce((acc, tenant) => {
        const gender = tenant.gender === 'L' ? 'Laki-laki' : 'Perempuan';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {});

      // Distance analysis
      const distanceRanges = {
        'Sangat Dekat (< 5km)': 0,
        'Dekat (5-15km)': 0,
        'Sedang (15-30km)': 0,
        'Jauh (> 30km)': 0
      };

      tenants.forEach(tenant => {
        const distance = tenant.distanceToCampus || 0;
        if (distance < 5) {
          distanceRanges['Sangat Dekat (< 5km)']++;
        } else if (distance < 15) {
          distanceRanges['Dekat (5-15km)']++;
        } else if (distance < 30) {
          distanceRanges['Sedang (15-30km)']++;
        } else {
          distanceRanges['Jauh (> 30km)']++;
        }
      });

      // Tenant type distribution
      const tenantTypeDistribution = tenants.reduce((acc, tenant) => {
        const type = tenant.tenantType?.name || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Booking status distribution
      const bookingStatusDistribution = bookings.reduce((acc, booking) => {
        const status = booking.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Room classification distribution
      const roomClassificationDistribution = rooms.reduce((acc, room) => {
        const classification = room.classification?.name || 'Unknown';
        acc[classification] = (acc[classification] || 0) + 1;
        return acc;
      }, {});

      // Document verification status
      const documentStats = tenants.reduce((acc, tenant) => {
        const documents = tenant.documents || [];
        documents.forEach(doc => {
          acc[doc.status] = (acc[doc.status] || 0) + 1;
        });
        return acc;
      }, { pending: 0, approved: 0, rejected: 0 });      // Rental type distribution
      const rentalTypeDistribution = rooms.reduce((acc, room) => {
        const rentalType = room.rentalType?.name || 'Unknown';
        acc[rentalType] = (acc[rentalType] || 0) + 1;
        return acc;
      }, {});      // Booking statistics for success rate calculation
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(booking => 
        booking.status === 'completed' || booking.status === 'finished' || booking.status === 'approved'
      ).length;

      // Document statistics (if documents exist in tenants)
      const totalDocuments = tenants.reduce((sum, tenant) => {
        return sum + (tenant.documents?.length || 0);
      }, 0);
      const approvedDocuments = tenants.reduce((sum, tenant) => {
        return sum + (tenant.documents?.filter(doc => doc.status === 'approved').length || 0);
      }, 0);

      return {
        // Basic metrics
        totalTenants,
        totalRooms,
        availableRooms,
        occupiedRooms,
        totalOccupants,
        totalCapacity,
        activeBookings,
        totalRevenue,
        monthlyRevenue,
        totalBookings,
        completedBookings,
        totalDocuments,
        approvedDocuments,
        
        // Chart data
        genderDistribution,
        distanceRanges,
        tenantTypeDistribution,
        bookingStatusDistribution,
        roomClassificationDistribution,
        documentStats,
        rentalTypeDistribution,
        paymentMethodDistribution,
        paymentChannelDistribution,
        paymentStatusDistribution,
        revenueByPaymentMethod,
        monthlyRevenueTrend,
        
        // Raw data for additional processing
        tenants,
        bookings,
        rooms,
        payments
      };
    } catch (error) {
      console.error('Get dashboard data error:', error);
      throw new Error(error.message || 'Failed to fetch dashboard data');
    }
  }
};

export default dashboardService;
