import IssueList from "../pages/IssueList.jsx";
import IssueReport from "../pages/IssueReport.jsx";
import IssueEdit from "../pages/IssueEdit.jsx";
import About from "../pages/About.jsx";
import NotFound from "../pages/NotFound.jsx";

const routes = [
  { path: "/", redirectTo: "/issues", replace: true },
  { path: "/issues", component: IssueList },
  { path: "/issues/:id", component: IssueList },
  { path: "/create", component: IssueEdit },
  { path: "/edit/:id", component: IssueEdit },
  { path: "/report", component: IssueReport },
  { path: "/about", component: About },
  { path: "*", component: NotFound },
];

export default routes;
