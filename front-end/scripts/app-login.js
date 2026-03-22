document.addEventListener("DOMContentLoaded", () => {
  const btnEntrar = document.querySelector("button");
  const inputs = document.querySelectorAll("input");

  // Atribuindo os inputs
  const inputEmail = document.getElementById("email");
  const inputSenha = document.getElementById("senha");

  const toggleSenha = document.querySelector(".toggle-senha");

  // --- NOVA LÓGICA: Tecla Enter ---
  // Adiciona o evento de apertar tecla nos dois campos
  function verificarEnter(event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Evita comportamentos padrões
      btnEntrar.click(); // Simula o clique no botão
    }
  }

  inputEmail.addEventListener("keydown", verificarEnter);
  inputSenha.addEventListener("keydown", verificarEnter);
  // --------------------------------

  // Evento de Clique (Lógica de Login)
  btnEntrar.addEventListener("click", async (event) => {
    event.preventDefault();

    const email = inputEmail.value;
    const senha = inputSenha.value;

    if (!email || !senha) {
      mostrarAlerta("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (response.ok) {
        const data = await response.json();

        // Salva dados do usuário
        localStorage.removeItem("authToken");
        localStorage.setItem("usuarioLogado", data.nome);
        localStorage.setItem("isAdmin", data.isAdmin); // Salva permissão de Admin
        localStorage.setItem("authToken", data.token);

        window.location.href = "menu.html";
      } else {
        const data = await response.json();
        mostrarAlerta(data.error || "Falha no login");
      }
    } catch (error) {
      console.error("Erro:", error);
      mostrarAlerta("Erro de conexão com o servidor.");
    }
  });

  toggleSenha.addEventListener("click", () => {
    if (inputSenha.type === "password") {
      inputSenha.type = "text";
      toggleSenha.textContent = "🙈";
    } else {
      inputSenha.type = "password";
      toggleSenha.textContent = "👁️";
    }
  });
});

function mostrarAlerta(mensagem) {
  const alerta = document.createElement("div");

  alerta.className = "alerta erro";
  alerta.innerText = mensagem;

  document.body.appendChild(alerta);

  setTimeout(() => {
    alerta.classList.add("show");
  }, 10);

  setTimeout(() => {
    alerta.classList.remove("show");
    setTimeout(() => alerta.remove(), 300);
  }, 3000);
}
