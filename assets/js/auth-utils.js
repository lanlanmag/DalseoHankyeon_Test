(function () {
  'use strict';

  const AuthUtils = {
    getCsrfToken(key = "SESSIONID") {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const pair = cookie.trim().split('=');
        const name = pair.shift();
        const value = pair.join('=');
        if (name === `${key}_CSRF_TOKEN`) {
          return decodeURIComponent(value || '');
        }
      }
      return '';
    },
    async checkLoginStatus() {
      try {
        const response = await fetch('/api/v1/auth/login', {
          method: 'GET',
          credentials: 'include'
        });
        if (response.ok) return await response.json();
        return false;
      } catch (error) {
        console.error('로그인 상태 확인 중 오류:', error);
        return false;
      }
    },
    async logout() {
      try {
        const csrfToken = this.getCsrfToken();
        const response = await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'X-Csrf-Token': csrfToken },
          credentials: 'include'
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok) return { success: true, message: data.message || '로그아웃되었습니다.' };
        return { success: false, message: data.detail || '로그아웃에 실패했습니다.' };
      } catch (error) {
        console.error('로그아웃 요청 중 오류 발생:', error);
        return { success: false, message: '네트워크 오류가 발생했습니다.' };
      }
    },
    authenticatedFetch(url, options = {}) {
      const csrfToken = this.getCsrfToken();
      const defaultOptions = {
        credentials: 'include',
        headers: {
          'X-Csrf-Token': csrfToken,
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      };
      return fetch(url, { ...defaultOptions, ...options });
    },
  };

  if (typeof window !== 'undefined') window.AuthUtils = AuthUtils;
  if (typeof module !== 'undefined' && module.exports) module.exports = AuthUtils;
})();