import React from "react";
import AdminUsersTable from "./AdminUsersTable";

export default function AdminStaffTable() {
  return <AdminUsersTable roleFilter="teacher" title="Staff" />;
}
