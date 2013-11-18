TSC=tsc
JS_DIR=./js
TS_DIR=./ts

all: $(TS_DIR)/*.ts
	$(TSC) $(TS_DIR)/*.ts -out $(JS_DIR)/main.js

clean:
	rm $(JS_DIR)/main.js
