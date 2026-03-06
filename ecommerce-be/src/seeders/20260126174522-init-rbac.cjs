"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Insert roles nếu chưa có
    await queryInterface.bulkInsert(
      "roles",
      [
        {
          name: "Admin",
          slug: "admin",
          description: "Quản trị viên",
          created_at: now,
          updated_at: now,
        },
        {
          name: "User",
          slug: "user",
          description: "Khách hàng",
          created_at: now,
          updated_at: now,
        },
      ],
      { ignoreDuplicates: true },
    );

    // 2. Insert permissions
    await queryInterface.bulkInsert(
      "permissions",
      [
        {
          code: "CREATE_PRODUCT",
          resource: "products",
          action: "create",
          created_at: now,
          updated_at: now,
        },
        {
          code: "VIEW_PRODUCT",
          resource: "products",
          action: "view",
          created_at: now,
          updated_at: now,
        },
      ],
      { ignoreDuplicates: true },
    );

    // 3. LẤY ID THẬT
    const [[admin]] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE slug = 'admin'",
    );
    const [[user]] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE slug = 'user'",
    );

    const [permissions] = await queryInterface.sequelize.query(
      "SELECT id, code FROM permissions",
    );

    const permMap = Object.fromEntries(permissions.map((p) => [p.code, p.id]));

    // 4. Insert role_permissions
    await queryInterface.bulkInsert(
      "role_permissions",
      [
        { role_id: admin.id, permission_id: permMap.CREATE_PRODUCT },
        { role_id: admin.id, permission_id: permMap.VIEW_PRODUCT },
        { role_id: user.id, permission_id: permMap.VIEW_PRODUCT },
      ],
      { ignoreDuplicates: true },
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("role_permissions", null, {});
  },
};
