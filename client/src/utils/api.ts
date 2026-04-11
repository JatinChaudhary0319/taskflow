const V1_API_ENDPOINTS = {
  Admin: {
    login: "/v1/admin/login",
    send_otp: "/v1/admin/send-otp",
    verify_otp: "/v1/admin/verify-otp",
    get_notice: "/v1/admin/get-notice",
    update_theme: "/v1/admin/update-theme",
    get_all_admin: "/v1/admin/get-all-admin",
    update_Profile: "/v1/admin/update-profile",
    verify_password: "/v1/admin/verify-password",
    update_password: "/v1/admin/update-password",
    get_all_student: "/v1/admin/get-all-student",
    get_all_faculty: "/v1/admin/get-all-faculty",
    get_all_department: "/v1/admin/get-all-department",
  },
  Trackify: {
    get_locations: "/v1/location/get-locations",
  }
};

export default V1_API_ENDPOINTS;
