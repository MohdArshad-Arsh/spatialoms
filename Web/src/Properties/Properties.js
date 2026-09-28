const RUNTIME_API_BASE = (typeof window !== 'undefined' && window.__ENV__?.API_BASE_URL) || null;

export const properties = {
    Port: RUNTIME_API_BASE
        ? RUNTIME_API_BASE + "/"
        : (process.env.REACT_APP_API_URL || "http://localhost:8080/oms-backend/"),

    TilesBase: RUNTIME_API_BASE
        ? RUNTIME_API_BASE
        : (process.env.REACT_APP_TILES_BASE
            || (process.env.NODE_ENV === 'production'
                ? "/oms-backend"
                : "http://localhost:8080/oms-backend")),

    loginURL: "auth/login",
    validateToken: "auth/validate",
    logoutURL: "auth/logout",
    changePassword: "auth/changePassword",
    refreshToken: "auth/refreshToken",
    createOrder: "order/createOrder",
    getAllOrders: "order/getAllOrder",
    getOrderById: "order/getOrderById/",
    getAllClientName: "order/getAllClient",
    getOrderByPoId: "order/getOrderByPoId/",
    getOrdersByStatus: "order/getOrdersByStatus/",
    getOrdersByVendor: "order/getOrdersByVendor/",
    getOrdersByClient: "order/getOrdersByClient/",
    updateOrder: "order/updateOrder",
    updateOrderStatus: "order/updateStatus",
    updateOrderProgress: "order/updateProgress",
    updateOrderVendor: "order/updateVendor",
    deleteOrder: "order/deleteOrder/",
    cancelOrder: "order/cancelOrder/",
    getOrderHistory: "order/history/",
    getOrderHistoryById: "order/history/details/",
    getOrderStats: "order/statistics",
    getOrderStatusCount: "order/statusCount",
    getOrderAreaCoverage: "order/areaCoverage",
    getAoiByOrderId: "order/aoi/",
    getAllAoi: "order/getAllAoi",
    getAoiByPoId: "aoi/getByPoId/",
    createAoi: "aoi/create",
    updateAoi: "aoi/update",
    uploadAoi: "aoi/upload",
    deleteAoi: "aoi/delete/",
    getAoiStats: "aoi/statistics/",
    calculateAoiArea: "aoi/calculateArea",
    getAllVendors: "vendor/getAllVendors",
    getVendorById: "vendor/getVendorById/",
    getVendorByName: "vendor/getVendorByName/",
    getOrderHistoryByOrderId: "order/getAllOrderHistoryBYId/",
    getAllCreatedOrders: "order/getAllCreatedOrder",
    approveOrder: "order/approveOrder/", // For approval API
    signupURL: "auth/signup",

    // Add these new endpoints
    signupURL: "auth/signup",
    getAllCreatedOrders: "order/getAllCreatedOrder",
    approveOrder: "order/approveOrder/",
    getOrderHistoryByOrderId: "order/getAllOrderHistoryBYId/",

    // Create/Update Vendors
    createVendor: "vendor/create",
    updateVendor: "vendor/update",

    // Delete Vendors
    deleteVendor: "vendor/delete/",

    // Vendor Sensors
    getVendorSensors: "vendor/sensors/",
    updateVendorSensors: "vendor/updateSensors",

    // Vendor Statistics
    getVendorStats: "vendor/statistics",
    getVendorOrderCount: "vendor/orderCount/",
    getAllSensors: "sensor/getAllSensors",
    getSensorById: "sensor/getSensorById/",
    getSensorsByVendor: "sensor/getByVendor/",
    createSensor: "sensor/create",
    updateSensor: "sensor/update",
    deleteSensor: "sensor/delete/",
    // Get Users
    getAllUsers: "user/getAllUsers",
    getUserById: "user/getUserById/",
    getUserByUsername: "user/getUserByUsername/",
    getUsersByRole: "user/getUsersByRole/",

    // Create/Update Users
    createUser: "user/create",
    updateUser: "user/update",
    updateUserProfile: "user/updateProfile",
    updateUserPassword: "user/updatePassword",

    // Delete Users
    deleteUser: "user/delete/",
    deactivateUser: "user/deactivate/",
    activateUser: "user/activate/",

    // User Roles
    getUserRoles: "user/roles",
    assignUserRole: "user/assignRole",
    getAllRoles: "role/getAllRoles",
    getRoleById: "role/getRoleById/",
    createRole: "role/create",
    updateRole: "role/update",
    deleteRole: "role/delete/",
    getRolePermissions: "role/permissions/",
    updateRolePermissions: "role/updatePermissions",
    getAllNotifications: "notification/getAll",
    getNotificationsByUser: "notification/getByUser/",
    getUnreadNotifications: "notification/getUnread",
    getNotificationCount: "notification/count",

    // Update Notifications
    markNotificationRead: "notification/markRead/",
    markAllRead: "notification/markAllRead",

    // Delete Notifications
    deleteNotification: "notification/delete/",
    clearAllNotifications: "notification/clearAll",

    // Create Notifications
    createNotification: "notification/create",
    sendNotification: "notification/send",
    getDashboardStats: "dashboard/statistics",
    getDashboardOrders: "dashboard/recentOrders",
    getDashboardAreaCoverage: "dashboard/areaCoverage",
    getDashboardOrdersByStatus: "dashboard/ordersByStatus",
    getDashboardOrdersByVendor: "dashboard/ordersByVendor",
    getDashboardOrdersByPriority: "dashboard/ordersByPriority",
    getDashboardTimeline: "dashboard/timeline",
    getMapTiles: "map/tiles",
    getWorldTiles: "tiles/",
    getIndiaTiles: "india_tiles/",
    getMapBounds: "map/bounds",
    getMapLayers: "map/layers",
    uploadGeoJson: "file/upload/geojson",
    uploadShapefile: "file/upload/shapefile",
    uploadZip: "file/upload/zip",
    downloadAoi: "file/download/aoi/",
    downloadOrder: "file/download/order/",
    generateOrderReport: "report/order/",
    generateVendorReport: "report/vendor/",
    generateAreaReport: "report/area",
    generateStatusReport: "report/status",
    exportOrdersCSV: "report/export/orders/csv",
    exportOrdersExcel: "report/export/orders/excel",
    exportOrdersPDF: "report/export/orders/pdf",
    searchOrders: "search/orders",
    searchAoi: "search/aoi",
    filterOrders: "filter/orders",
    filterByDateRange: "filter/dateRange",
    filterByVendor: "filter/vendor",
    filterByStatus: "filter/status",
    filterByClient: "filter/client",
    filterBySensor: "filter/sensor",
    validateOrder: "validate/order",
    validateAoi: "validate/aoi",
    validateGeoJson: "validate/geojson",
    validateShapefile: "validate/shapefile",
    getAuditLogs: "audit/logs",
    getAuditLogsByUser: "audit/logs/user/",
    getAuditLogsByOrder: "audit/logs/order/",
    getAuditLogsByDate: "audit/logs/date",
    getSystemConfig: "config/system",
    updateSystemConfig: "config/update",
    getAppVersion: "config/version",
    getAppSettings: "config/settings",
    updateAppSettings: "config/updateSettings",
    getAllPriorities: "priority/getAll",
    updateOrderPriority: "order/updatePriority",
    getAllClients: "client/getAll",
    getClientById: "client/getById/",
    createClient: "client/create",
    updateClient: "client/update",
    deleteClient: "client/delete/",
    getClientOrders: "client/orders/",
    batchUpdateOrders: "batch/updateOrders",
    batchDeleteOrders: "batch/deleteOrders",
    batchAssignVendor: "batch/assignVendor",
    batchUpdateStatus: "batch/updateStatus",
    getOrderTrends: "analytics/orderTrends",
    getVendorPerformance: "analytics/vendorPerformance",
    getAreaUtilization: "analytics/areaUtilization",
    getCompletionRate: "analytics/completionRate",
    getSensorUsage: "analytics/sensorUsage",
    importOrders: "import/orders",
    exportOrders: "export/orders",
    importAoi: "import/aoi",
    exportAoi: "export/aoi",
    bulkUpload: "import/bulk",
    websocketUrl: "ws://localhost:8080/ws",
    orderUpdatesChannel: "ws/orders",
    notificationChannel: "ws/notifications",
    statusUpdatesChannel: "ws/status",
    /**
     * Get full URL for an endpoint
     * @param {string} endpoint - The endpoint path
     * @returns {string} Full URL
     */
    getFullUrl: function (endpoint) {
        return this.Port + endpoint;
    },

    /**
     * Get full URL with ID parameter
     * @param {string} endpoint - The endpoint path
     * @param {string|number} id - The ID parameter
     * @returns {string} Full URL with ID
     */
    getUrlWithId: function (endpoint, id) {
        return this.Port + endpoint + id;
    },

    /**
     * Build URL with query parameters
     * @param {string} endpoint - The endpoint path
     * @param {object} params - Query parameters
     * @returns {string} Full URL with query string
     */
    buildUrlWithParams: function (endpoint, params) {
        const url = this.Port + endpoint;
        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        return queryString ? `${url}?${queryString}` : url;
    },
};
export default properties;