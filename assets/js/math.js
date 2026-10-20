function readableFormula(tex) {
  let text = tex.replace(/^\\\[|\\\]$|^\\\(|\\\)$|^\$\$|\$\$$|^\$|\$$/g, "").trim();
  // Convert the common TeX constructs to readable text if the CDN is offline.
  for (let i = 0; i < 8; i++) {
    const next = text.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)");
    if (next === text) break;
    text = next;
  }
  text = text.replace(/\\bar\{([^{}])\}/g, "$1̄").replace(/\\hat\{([^{}])\}/g, "$1̂");
  const commands = {
    theta: "θ", alpha: "α", beta: "β", gamma: "γ", delta: "δ",
    Delta: "Δ", epsilon: "ε", lambda: "λ", mu: "μ", pi: "π",
    sigma: "σ", Sigma: "Σ", sum: "∑", prod: "∏", sqrt: "√",
    cdot: "·", times: "×", approx: "≈", propto: "∝", infty: "∞",
    leq: "≤", geq: "≥", neq: "≠", hat: "", bar: "",
    left: "", right: "", text: "", mathbf: "", boldsymbol: "",
    quad: " ", qquad: "  ", log: "log", exp: "exp", max: "max",
    min: "min", mathcal: "", vert: "|"
  };
  text = text.replace(/\\([A-Za-z]+)/g, (all, name) => commands[name] ?? name);
  text = text.replace(/\\\|/g, "‖").replace(/\|\|/g, "‖");
  text = text.replace(/\^\{2\}|\^2/g, "²").replace(/\^\{3\}|\^3/g, "³");
  text = text.replace(/_\{([^{}]+)\}/g, "₍$1₎").replace(/_([a-zA-Z0-9])/g, "₍$1₎");
  text = text.replace(/[{}]/g, "").replace(/\\/g, "");
  return text.replace(/\s+/g, " ");
}

function renderKafeMath() {
  if (typeof renderMathInElement === "function") {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false
    });
  } else {
    document.querySelectorAll(".arithmatex").forEach((node) => {
      node.textContent = readableFormula(node.textContent);
      node.classList.add("math-fallback");
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderKafeMath);
} else {
  renderKafeMath();
}
