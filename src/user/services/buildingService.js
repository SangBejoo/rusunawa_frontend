import apiClient from './apiClient';

const API_BASE = '/admin/buildings';

class BuildingService {
  // Get all buildings with filters
  async getBuildings(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.genderType) queryParams.append('gender_type', params.genderType);
      if (params.isActive !== undefined) queryParams.append('is_active', params.isActive);
      if (params.search) queryParams.append('search', params.search);

      const response = await apiClient.get(`${API_BASE}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching buildings:', error);
      throw error;
    }
  }

  // Get building by ID
  async getBuildingById(buildingId) {
    try {
      const response = await apiClient.get(`${API_BASE}/${buildingId}`);
      return response.data.building;
    } catch (error) {
      console.error('Error fetching building:', error);
      throw error;
    }
  }

  // Create new building
  async createBuilding(buildingData) {
    try {
      const payload = {
        building_code: buildingData.buildingCode,
        building_name: buildingData.buildingName,
        gender_type: buildingData.genderType,
        address: buildingData.address || '',
        description: buildingData.description || '',
        total_floors: buildingData.totalFloors
      };

      const response = await apiClient.post(API_BASE, payload);
      return response.data;
    } catch (error) {
      console.error('Error creating building:', error);
      throw error;
    }
  }

  // Update building
  async updateBuilding(buildingId, buildingData) {
    try {
      const payload = {
        building_id: buildingId,
        building_code: buildingData.buildingCode,
        building_name: buildingData.buildingName,
        gender_type: buildingData.genderType,
        address: buildingData.address || '',
        description: buildingData.description || '',
        total_floors: buildingData.totalFloors,
        is_active: buildingData.isActive
      };

      const response = await apiClient.put(`${API_BASE}/${buildingId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating building:', error);
      throw error;
    }
  }

  // Delete building
  async deleteBuilding(buildingId) {
    try {
      const response = await apiClient.delete(`${API_BASE}/${buildingId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting building:', error);
      throw error;
    }
  }

  // Get building statistics
  async getBuildingStats(buildingId = null) {
    try {
      const url = buildingId 
        ? `${API_BASE}/stats?building_id=${buildingId}`
        : `${API_BASE}/stats`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching building stats:', error);
      throw error;
    }
  }

  // Get floors by building
  async getFloorsByBuilding(buildingId, isAvailable = null) {
    try {
      const queryParams = new URLSearchParams();
      if (isAvailable !== null) queryParams.append('is_available', isAvailable);

      const response = await apiClient.get(`${API_BASE}/${buildingId}/floors?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching floors:', error);
      throw error;
    }
  }

  // Get floor by ID
  async getFloorById(floorId) {
    try {
      const response = await apiClient.get(`/admin/floors/${floorId}`);
      return response.data.floor;
    } catch (error) {
      console.error('Error fetching floor:', error);
      throw error;
    }
  }

  // Create new floor
  async createFloor(floorData) {
    try {
      const payload = {
        building_id: floorData.buildingId,
        floor_number: floorData.floorNumber,
        floor_name: floorData.floorName || `Lantai ${floorData.floorNumber}`,
        description: floorData.description || '',
        max_capacity: floorData.maxCapacity || 0
      };

      const response = await apiClient.post('/admin/floors', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating floor:', error);
      throw error;
    }
  }

  // Update floor
  async updateFloor(floorId, floorData) {
    try {
      const payload = {
        floor_id: floorId,
        floor_number: floorData.floorNumber,
        floor_name: floorData.floorName,
        description: floorData.description || '',
        is_available: floorData.isAvailable,
        max_capacity: floorData.maxCapacity || 0
      };

      const response = await apiClient.put(`/admin/floors/${floorId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating floor:', error);
      throw error;
    }
  }

  // Delete floor
  async deleteFloor(floorId) {
    try {
      const response = await apiClient.delete(`/admin/floors/${floorId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting floor:', error);
      throw error;
    }
  }

  // Get floor statistics
  async getFloorStats(floorId = null, buildingId = null) {
    try {
      const queryParams = new URLSearchParams();
      if (floorId) queryParams.append('floor_id', floorId);
      if (buildingId) queryParams.append('building_id', buildingId);

      const response = await apiClient.get(`/admin/floors/stats?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching floor stats:', error);
      throw error;
    }
  }

  // Enhanced room search with building/floor filtering
  async searchRooms(searchParams = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (searchParams.name) queryParams.append('name', searchParams.name);
      if (searchParams.classification) queryParams.append('classification', searchParams.classification);
      if (searchParams.buildingId) queryParams.append('building_id', searchParams.buildingId);
      if (searchParams.floorId) queryParams.append('floor_id', searchParams.floorId);
      if (searchParams.isAvailable !== undefined) queryParams.append('is_available', searchParams.isAvailable);
      if (searchParams.minCapacity) queryParams.append('min_capacity', searchParams.minCapacity);
      if (searchParams.maxCapacity) queryParams.append('max_capacity', searchParams.maxCapacity);
      if (searchParams.page) queryParams.append('page', searchParams.page);
      if (searchParams.limit) queryParams.append('limit', searchParams.limit);
      if (searchParams.sortBy) queryParams.append('sort_by', searchParams.sortBy);
      if (searchParams.sortOrder) queryParams.append('sort_order', searchParams.sortOrder);

      const response = await apiClient.get(`/admin/rooms/search?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching rooms:', error);
      throw error;
    }
  }

  // Get rooms by building
  async getRoomsByBuilding(buildingId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.classification) queryParams.append('classification', params.classification);
      if (params.isAvailable !== undefined) queryParams.append('is_available', params.isAvailable);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const response = await apiClient.get(`${API_BASE}/${buildingId}/rooms?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms by building:', error);
      throw error;
    }
  }

  // Get rooms by floor
  async getRoomsByFloor(floorId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.classification) queryParams.append('classification', params.classification);
      if (params.isAvailable !== undefined) queryParams.append('is_available', params.isAvailable);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const response = await apiClient.get(`/admin/floors/${floorId}/rooms?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms by floor:', error);
      throw error;
    }
  }
}

export default new BuildingService();
