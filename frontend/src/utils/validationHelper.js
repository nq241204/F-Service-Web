// frontend/src/utils/validationHelper.js - Helper cho validation errors
export const formatValidationErrors = (errors) => {
  if (!errors || !Array.isArray(errors)) {
    return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }

  return errors.map(error => {
    // Map các field sang tiếng Việt dễ hiểu
    const fieldNames = {
      email: 'Email',
      password: 'Mật khẩu',
      password2: 'Xác nhận mật khẩu',
      name: 'Họ và tên',
      phone: 'Số điện thoại',
      address: 'Địa chỉ',
      captcha: 'Mã xác thực',
      terms: 'Điều khoản sử dụng'
    };

    const fieldName = fieldNames[error.field] || error.field;
    return `${fieldName}: ${error.message}`;
  }).join('\n');
};

export const getErrorMessage = (error) => {
  if (!error.response) {
    return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
  }

  const { status, data } = error.response;

  // Validation errors (400)
  if (status === 400 && data.errors) {
    return formatValidationErrors(data.errors);
  }

  // Conflict (409) - Email đã tồn tại
  if (status === 409) {
    return data.message || 'Email đã được sử dụng. Vui lòng chọn email khác.';
  }

  // Unauthorized (401)
  if (status === 401) {
    // Handle specific error messages from backend
    if (data.message) {
      if (data.message.includes('không tồn tại')) {
        return data.message + (data.suggestion ? ` ${data.suggestion}` : '');
      }
      if (data.message.includes('Mật khẩu không đúng')) {
        return data.message;
      }
      return data.message;
    }
    return 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
  }

  // Forbidden (403)
  if (status === 403) {
    return 'Bạn không có quyền thực hiện hành động này.';
  }

  // Not found (404)
  if (status === 404) {
    return 'Tài nguyên không tồn tại.';
  }

  // Server error (500)
  if (status >= 500) {
    return 'Lỗi server. Vui lòng thử lại sau.';
  }

  // Default error
  return data.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
};

export const getFieldError = (errors, fieldName) => {
  if (!errors || !Array.isArray(errors)) {
    return null;
  }

  const error = errors.find(err => err.field === fieldName);
  return error ? error.message : null;
};

export const hasFieldError = (errors, fieldName) => {
  return getFieldError(errors, fieldName) !== null;
};
