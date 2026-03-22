const usuarioLogado = localStorage.getItem("usuarioLogado");
const authToken = localStorage.getItem("authToken");
if (!usuarioLogado || !authToken) {
  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("authToken");
  window.location.href = "login.html";
}

if (!window.__authFetchPatched) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const tokenAtual = localStorage.getItem("authToken");
    const headers = new Headers(init.headers || {});

    if (tokenAtual) {
      headers.set("Authorization", "Bearer " + tokenAtual);
    }

    const response = await originalFetch(input, { ...init, headers });

    if (response.status === 401) {
      localStorage.removeItem("usuarioLogado");
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("authToken");
      window.location.href = "login.html";
    }

    return response;
  };
  window.__authFetchPatched = true;
}

document.addEventListener("DOMContentLoaded", () => {
  const nomeUsuario = localStorage.getItem("usuarioLogado");
  const greetingElement = document.getElementById("userGreeting");

  if (nomeUsuario) {
    greetingElement.textContent = `Olá, ${nomeUsuario}`;
  }

  document.getElementById("btnLogout").addEventListener("click", () => {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("authToken");
    window.location.href = "login.html";
  });
});
