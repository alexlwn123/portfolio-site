import Layout from "./Layout/Layout";
import Display from "./components/Display";
import Sidebar from "./components/SlideBar";
export default function App() {
  return (
    <Layout>
      <Sidebar />
      <Display />
    </Layout>
  );
}
