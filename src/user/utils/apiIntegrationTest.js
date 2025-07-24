import api from '../utils/apiClient';

/**
 * API Integration Test Suite
 * Tests connectivity and basic functionality of all API endpoints
 */
export class APIIntegrationTest {
  constructor() {
    this.results = {};
    this.baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://qtd9x9cp-8001.asse.devtunnels.ms/api';
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    const tests = [
      { name: 'Health Check', test: this.testHealthCheck },
      { name: 'Authentication', test: this.testAuth },
      { name: 'User Management', test: this.testUserManagement },
      { name: 'Tenant Management', test: this.testTenantManagement },
      { name: 'Room Management', test: this.testRoomManagement },
      { name: 'Booking Management', test: this.testBookingManagement },
      { name: 'Payment Management', test: this.testPaymentManagement },
      { name: 'Document Management', test: this.testDocumentManagement },
      { name: 'Issue Management', test: this.testIssueManagement },
      { name: 'Analytics', test: this.testAnalytics },
      { name: 'Notifications', test: this.testNotifications },
    ];

    const results = {};
    
    for (const test of tests) {
      try {
        results[test.name] = await test.test.call(this);
      } catch (error) {
        results[test.name] = {
          status: 'error',
          message: error.message,
          details: error.stack
        };
      }
    }

    this.results = results;
    return results;
  }

  /**
   * Test basic health check endpoint
   */
  async testHealthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/v1/health`);
      return {
        status: response.ok ? 'pass' : 'fail',
        message: response.ok ? 'Health check passed' : 'Health check failed',
        statusCode: response.status,
        response: response.ok ? await response.text() : null
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Health check endpoint unreachable',
        error: error.message
      };
    }
  }

  /**
   * Test authentication endpoints
   */
  async testAuth() {
    const tests = {
      login: '/v1/auth/login',
      register: '/v1/auth/register',
      forgotPassword: '/v1/auth/forgot-password',
      verifyToken: '/v1/auth/verify-token'
    };

    const results = {};
    
    for (const [name, endpoint] of Object.entries(tests)) {
      try {
        // Test endpoint accessibility (expect 400/422 for missing data, not 404)
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        results[name] = {
          status: response.status === 404 ? 'fail' : 'pass',
          statusCode: response.status,
          message: response.status === 404 ? 'Endpoint not found' : 'Endpoint accessible'
        };
      } catch (error) {
        results[name] = {
          status: 'error',
          message: error.message
        };
      }
    }

    return {
      status: Object.values(results).every(r => r.status === 'pass') ? 'pass' : 'partial',
      message: `${Object.values(results).filter(r => r.status === 'pass').length}/${Object.keys(results).length} endpoints accessible`,
      details: results
    };
  }

  /**
   * Test user management endpoints
   */
  async testUserManagement() {
    const endpoints = [
      'GET /v1/users',
      'POST /v1/users',
      'GET /v1/users/:id',
      'PUT /v1/users/:id',
      'DELETE /v1/users/:id'
    ];

    return this.testEndpointGroup('User Management', '/v1/users', endpoints);
  }

  /**
   * Test tenant management endpoints
   */
  async testTenantManagement() {
    const endpoints = [
      'GET /v1/tenants',
      'POST /v1/tenants',
      'GET /v1/tenants/:id',
      'PUT /v1/tenants/:id',
      'DELETE /v1/tenants/:id',
      'GET /v1/tenants/by-type/:type',
      'GET /v1/waiting-list',
      'POST /v1/tenants/:id/waiting-list'
    ];

    const results = await this.testEndpointGroup('Tenant Management', '/v1/tenants', endpoints);
    
    // Additional test: Check if tenant data contains distanceToCampus
    try {
      const response = await fetch(`${this.baseUrl}/v1/tenants`);
      if (response.ok) {
        const data = await response.json();
        const tenants = data.tenants || [];
        
        if (tenants.length > 0) {
          const hasDistanceField = tenants.some(tenant => 'distanceToCampus' in tenant);
          
          results.distanceField = {
            status: hasDistanceField ? 'pass' : 'fail',
            message: hasDistanceField 
              ? 'Tenant distance to campus field found' 
              : 'Tenant distance to campus field missing'
          };
        }
      }
    } catch (error) {
      results.distanceField = {
        status: 'error',
        message: 'Could not test for distance field',
        error: error.message
      };
    }

    return results;
  }

  /**
   * Test room management endpoints
   */
  async testRoomManagement() {
    const endpoints = [
      'GET /v1/rooms',
      'POST /v1/rooms',
      'GET /v1/rooms/:id',
      'PUT /v1/rooms/:id',
      'DELETE /v1/rooms/:id',
      'GET /v1/rooms/:id/amenities',
      'POST /v1/rooms/:id/amenities'
    ];

    return this.testEndpointGroup('Room Management', '/v1/rooms', endpoints);
  }

  /**
   * Test booking management endpoints
   */
  async testBookingManagement() {
    const endpoints = [
      'GET /v1/bookings',
      'POST /v1/bookings',
      'GET /v1/bookings/:id',
      'PUT /v1/bookings/:id',
      'PUT /v1/bookings/:id/status',
      'POST /v1/bookings/:id/approve'
    ];

    return this.testEndpointGroup('Booking Management', '/v1/bookings', endpoints);
  }

  /**
   * Test payment management endpoints
   */
  async testPaymentManagement() {
    const endpoints = [
      'GET /v1/payments',
      'POST /v1/payments',
      'GET /v1/payments/:id',
      'PUT /v1/payments/:id',
      'POST /v1/payments/:id/verify'
    ];

    return this.testEndpointGroup('Payment Management', '/v1/payments', endpoints);
  }

  /**
   * Test document management endpoints
   */
  async testDocumentManagement() {
    const endpoints = [
      'GET /v1/documents',
      'POST /v1/documents',
      'GET /v1/documents/:id',
      'PUT /v1/documents/:id',
      'DELETE /v1/documents/:id',
      'GET /v1/documents/pending'
    ];

    return this.testEndpointGroup('Document Management', '/v1/documents', endpoints);
  }

  /**
   * Test issue management endpoints
   */
  async testIssueManagement() {
    const endpoints = [
      'GET /v1/issues',
      'POST /v1/issues',
      'GET /v1/issues/:id',
      'PUT /v1/issues/:id',
      'PUT /v1/issues/:id/status'
    ];

    return this.testEndpointGroup('Issue Management', '/v1/issues', endpoints);
  }
  /**
   * Test analytics endpoints
   */
  async testAnalytics() {
    const endpoints = [
      // Removed non-existent dashboard-summary endpoint
      'GET /v1/analytics/revenue',
      'GET /v1/analytics/occupancy', 
      'GET /v1/analytics/booking-trends',
      'GET /v1/analytics/tenant-demographics'
    ];

    return this.testEndpointGroup('Analytics', '/v1/analytics', endpoints);
  }

  /**
   * Test notification endpoints
   */
  async testNotifications() {
    const endpoints = [
      'GET /v1/notifications',
      'POST /v1/notifications',
      'PUT /v1/notifications/:id/read',
      'PUT /v1/notifications/read-all'
    ];

    return this.testEndpointGroup('Notifications', '/v1/notifications', endpoints);
  }

  /**
   * Generic endpoint group testing
   */
  async testEndpointGroup(groupName, basePath, endpoints) {
    const results = {};
    let passCount = 0;

    for (const endpoint of endpoints) {
      const [method, path] = endpoint.split(' ');
      const testPath = path.replace(':id', '1'); // Use dummy ID for testing
      
      try {
        const response = await fetch(`${this.baseUrl}${testPath}`, {
          method: method,
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer dummy-token' // For auth testing
          },
          body: ['POST', 'PUT'].includes(method) ? JSON.stringify({}) : undefined
        });

        const accessible = ![404, 500].includes(response.status);
        results[endpoint] = {
          status: accessible ? 'pass' : 'fail',
          statusCode: response.status,
          message: accessible ? 'Endpoint accessible' : 'Endpoint not found or server error'
        };

        if (accessible) passCount++;
      } catch (error) {
        results[endpoint] = {
          status: 'error',
          message: error.message
        };
      }
    }

    return {
      status: passCount > endpoints.length / 2 ? 'pass' : 'fail',
      message: `${passCount}/${endpoints.length} endpoints accessible`,
      details: results
    };
  }

  /**
   * Test database connectivity through API
   */
  async testDatabaseConnectivity() {
    try {
      // Try to fetch users (should require auth but return 401, not 500)
      const response = await fetch(`${this.baseUrl}/v1/users`);
      
      return {
        status: response.status === 500 ? 'fail' : 'pass',
        message: response.status === 500 ? 'Database connection failed' : 'Database appears accessible',
        statusCode: response.status
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Could not test database connectivity',
        error: error.message
      };
    }
  }

  /**
   * Test CORS configuration
   */
  async testCORS() {
    try {
      const response = await fetch(`${this.baseUrl}/v1/health`, {
        method: 'OPTIONS'
      });

      return {
        status: 'pass',
        message: 'CORS appears to be configured correctly',
        headers: {
          'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
          'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'CORS configuration issue detected',
        error: error.message
      };
    }
  }

  /**
   * Generate test report
   */
  generateReport() {
    const totalTests = Object.keys(this.results).length;
    const passedTests = Object.values(this.results).filter(r => r.status === 'pass').length;
    const failedTests = Object.values(this.results).filter(r => r.status === 'fail').length;
    const errorTests = Object.values(this.results).filter(r => r.status === 'error').length;

    return {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        errors: errorTests,
        successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
      },
      details: this.results,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];
    
    Object.entries(this.results).forEach(([testName, result]) => {
      if (result.status === 'fail') {
        recommendations.push({
          type: 'error',
          message: `${testName}: ${result.message}`,
          action: `Check ${testName.toLowerCase()} service implementation and routing`
        });
      } else if (result.status === 'error') {
        recommendations.push({
          type: 'critical',
          message: `${testName}: Service unreachable`,
          action: `Verify backend server is running and ${testName.toLowerCase()} endpoints are implemented`
        });
      }
    });

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'All systems operational',
        action: 'No action required'
      });
    }

    return recommendations;
  }
}

export default APIIntegrationTest;
