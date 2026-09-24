antlr:
	antlr -no-listener -visitor -Dlanguage=Python3 Kafe_Grammar.g4

clean:
	rm Kafe_GrammarLexer.py Kafe_GrammarParser.py Kafe_Grammar.tokens Kafe_GrammarVisitor.py Kafe_Grammar.interp Kafe_GrammarLexer.interp Kafe_GrammarLexer.tokens

test:
	if [ -z "$(suite)" ]; then \
		for i in $(wildcard ../tests/test_*.py); do \
			uv run --locked --project .. --group dev pytest $$i; \
		done; \
	else \
		for i in $(wildcard ../tests/test_$(suite).py); do \
			uv run --locked --project .. --group dev pytest $$i; \
		done; \
	fi
