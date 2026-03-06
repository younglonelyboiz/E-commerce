import fs from "fs";
import path from "path";

const modelsDir = "./src/models"; // Đường dẫn đến thư mục models của bạn

fs.readdirSync(modelsDir).forEach((file) => {
  if (file.endsWith(".js") && file !== "index.js") {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, "utf8");

    // Thay đổi Sequelize require thành import
    content = content.replace(
      "const Sequelize = require('sequelize');",
      "import { Model } from 'sequelize';",
    );

    // Thay đổi module.exports thành export default
    content = content.replace(
      /module\.exports = \(sequelize, DataTypes\) => \{[\s\S]*?\}/,
      "",
    );

    // Sửa class kế thừa
    content = content.replace(
      "class " + file.replace(".js", "") + " extends Sequelize.Model",
      "export default class " + file.replace(".js", "") + " extends Model",
    );

    // Thêm đuôi .js vào các lệnh import trong init-models nếu có
    if (file === "init-models.js") {
      content = content.replace(
        /require\("\.\/(.*?)"\)/g,
        'import _$1 from "./$1.js"',
      );
      content = content.replace(
        'const DataTypes = require("sequelize").DataTypes;',
        'import { DataTypes } from "sequelize";',
      );
      content = content.replace(
        "module.exports = initModels;",
        "export default initModels;",
      );
      content = content.replace("module.exports.initModels = initModels;", "");
      content = content.replace("module.exports.default = initModels;", "");
    }

    fs.writeFileSync(filePath, content);
    console.log(`Converted: ${file}`);
  }
});
