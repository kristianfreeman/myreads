import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("unlock", "routes/unlock.tsx"),
  route("lock", "routes/lock.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("books", "routes/books.tsx"),
  route("books/search", "routes/books.search.tsx"),
  route("books/:bookId", "routes/books.$bookId.tsx"),
] satisfies RouteConfig;
