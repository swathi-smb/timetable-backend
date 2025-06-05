import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Class from "./Class.js";

const Section = sequelize.define("Section", {
  section_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  section_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Class,
      key: "class_id",
    },
  },
  added_by: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  added_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  
}, {
  tableName: "Sections",
  timestamps: false,
});

Class.hasMany(Section, { foreignKey: "class_id" });
Section.belongsTo(Class, { foreignKey: "class_id" });

export default Section;
