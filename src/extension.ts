// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { format } from "prettier";
import { camelCase, pascalCase } from "change-case";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "wg-getters-and-setters" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.generateGettersAndSetters",
    () => {
      // The code you place here will be executed every time your command is executed

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      let code = ``;
      let reverse: boolean = false;

      for (let selection of editor.selections) {
        reverse = selection.isReversed;
      }

      let selections: vscode.Selection[];
      if (reverse) {
        selections = [...editor.selections].reverse();
      } else {
        selections = [...editor.selections];
      }

      for (let selection of selections) {
        code += editor.document.getText(selection);
        code += `\n`;
      }

      let text = code;

      if (text.length < 1) {
        vscode.window.showErrorMessage("No selected properties.");
        return;
      }

      const tabWidth = Number(editor.options.tabSize);

      try {
        var getterAndSetter = createGetterAndSetter(text, tabWidth);
        editor.edit((e) =>
          e.insert(selections[selections.length - 1].end, getterAndSetter)
        );
      } catch (error) {
        console.log(error);
        vscode.window.showErrorMessage(
          'Something went wrong! Try that the properties are in this format: "private String name;"'
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

function createGetterAndSetter(textProperties: string, tabWidth: number) {
  let rows = textProperties.split("\n").map((x) => x.replace(";", ""));
  let properties: Array<string> = [];

  for (let row of rows) {
    if (row.trim() !== "") {
      properties.push(row);
    }
  }

  const getters: string[] = [];
  const setters: string[] = [];

  for (let p in properties) {
    while (properties[p].startsWith(" ")) {
      properties[p] = properties[p].substring(1);
    }
    while (properties[p].startsWith("\t")) {
      properties[p] = properties[p].substring(1);
    }
    let words: Array<string> = [];

    let rows = properties[p].split(" ").map((x) => x.replace("\r\n", ""));
    for (let row of rows) {
      if (row.trim() !== "") {
        words.push(row);
      }
    }
    let type,
      attribute = "";
    let create = false;

    // if words === ["private", "name:", "string"];
    if (words.length === 3) {
      let attributeArray = words[1].split(":");
      type = words[2];
      attribute = attributeArray[0];

      create = true;
      // if words === ["private", "name:string"];
    } else if (words.length === 2) {
      let array = words[1].split(":");
      type = array[1];
      attribute = array[0];
      create = true;
      // if words === ["private", "name", ":", "string"];
    } else if (words.length === 4) {
      let array: Array<string> = [];
      for (let word of words) {
        if (word !== ":") {
          array.push(word);
        }
      }
      type = array[2].trim();
      attribute = array[1];
      create = true;
    } else {
      vscode.window.showErrorMessage(
        'Something went wrong! Try that the properties are in this format: "private name: string;"'
      );
      return "";
    }

    if (create) {
      getters.push(
        `public get${pascalCase(attribute)}(): ${type} {
          return this.${camelCase(attribute)};
        }`
      );

      setters.push(
        `public set${pascalCase(attribute)}(${camelCase(
          attribute
        )}: ${type}): void {
            this.${camelCase(attribute)} = ${camelCase(attribute)};
        }`
      );
    }
  }

  return (
    "\n\n" +
    format(
      `class {
      // Getters
      ${getters.join("\n\n")}
  
      // Setters
      ${setters.join("\n\n")}
    }`,
      { parser: "typescript", tabWidth }
    )
      .split("\n")
      .slice(1, -2)
      .join("\n")
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
