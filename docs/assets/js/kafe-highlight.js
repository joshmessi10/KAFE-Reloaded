// Syntax colors for ```kafe code blocks.
// Pygments has no KAFE lexer, so blocks arrive as plain text. These rules are
// copied from the VS Code grammar (kafe-vscode/syntaxes/kafe.tmLanguage.json)
// and emit the Pygments class names that Material's theme already colors.
(function () {
  const RULES = [
    ["c1", /--[^\n]*/y],                                   // line comment
    ["cm", /->[\s\S]*?<-/y],                               // block comment
    ["s2", /"(?:\\.|[^"\\\n])*"?/y],                       // double-quoted string
    ["s1", /'(?:\\.|[^'\\\n])*'?/y],                       // single-quoted string
    ["kc", /\b(?:True|False)\b/y],                         // booleans
    ["m", /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y],          // numbers
    ["k", /\b(?:if|else|elif|while|for|in|return|import|drip|pour|show|len|append|remove|range|FUNC)\b/y],
    ["nb", /\b(?:int|float|str|bool)\b/y],                 // casts
    ["kt", /\b(?:INT|FLOAT|BOOL|VOID|STR|GESHA|PARDOS|MACHINE|List)\b/y],
    ["nf", /\b[A-Za-z_]\w*(?=\s*\()/y],                    // function calls
    ["n", /\b[A-Za-z_]\w*\b/y],                            // other names
    ["o", /&&|\|\||==|!=|<=|>=|=>|[<>=!+*\/%^\-]/y],       // operators
    ["p", /[;:,()[\]{}.]/y],                               // punctuation
  ];

  function escape(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlight(source) {
    let html = "";
    let i = 0;
    while (i < source.length) {
      let matched = false;
      for (const [cls, re] of RULES) {
        re.lastIndex = i;
        const m = re.exec(source);
        if (m && m[0].length > 0) {
          const text = escape(m[0]);
          html += cls === "n" ? text : `<span class="${cls}">${text}</span>`;
          i += m[0].length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        html += escape(source[i]);
        i += 1;
      }
    }
    return html;
  }

  function run() {
    document.querySelectorAll(".language-kafe code:not([data-kafe-hl])").forEach((code) => {
      code.innerHTML = highlight(code.textContent);
      code.setAttribute("data-kafe-hl", "");
    });
  }

  if (typeof document$ !== "undefined") {
    document$.subscribe(run);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
