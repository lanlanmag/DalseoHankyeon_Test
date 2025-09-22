(function () {
  'use strict';

  async function install(unityInstance) {
    if (!window.AuthUtils) {
      console.warn('[AuthBridge] AuthUtils가 로드되지 않았습니다.');
      return;
    }

    // Unity에서 호출 가능한 전역 함수 (C# → JS)
    // JS 함수명이 링커에 남도록 전역에 달아두는 게 안전합니다.
    window.Js_OnUnityReady = async function () {
      try {
        const status = await window.AuthUtils.checkLoginStatus();
        const csrf = window.AuthUtils.getCsrfToken();
        console.log('[AuthBridge] CSRF:', csrf);

        unityInstance.SendMessage(
          "WebGateway",
          "OnLoginSuccess",
          JSON.stringify({ url: "/api/v1/auth/login", csrf, bodyStr: csrf })
        );
      } catch (e) {
        unityInstance.SendMessage(
          "WebGateway",
          "OnLoginError",
          JSON.stringify({ url: "/api/v1/auth/login", error: String(e) })
        );
      }
    };

    // Unity에서 JS를 “호출하지 않고” JS에서 직접 때때로 써야 할 함수들도 노출
    window.AuthBridge = {
      install, // 자기 자신(초기화 진입점)

      getCsrfToken: () => (window.AuthUtils?.getCsrfToken?.() || ""),
      checkLoginStatus: () => window.AuthUtils?.checkLoginStatus?.(),

      postJson: async (url, data, extraInit = {}) => {
        try {
          const res = await window.AuthUtils.authenticatedFetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(extraInit.headers || {}) },
            body: JSON.stringify(data),
            ...extraInit
          });
          const json = await res.json().catch(() => ({}));
          unityInstance.SendMessage("WebGateway", "OnLoginSuccess",
            JSON.stringify({ url, status: res.status, bodyStr: JSON.stringify(json) }));
        } catch (err) {
          unityInstance.SendMessage("WebGateway", "OnLoginError",
            JSON.stringify({ url, error: String(err) }));
        }
      },

      logout: async () => {
        const result = await window.AuthUtils.logout();
        unityInstance.SendMessage("WebGateway", "OnLogout", JSON.stringify(result));
      }
    };

    console.log('[AuthBridge] installed');
  }

  // 전역 노출
  window.AuthBridge = { install };
})();
