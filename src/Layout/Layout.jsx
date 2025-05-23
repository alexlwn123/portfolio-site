const Layout = ({ children }) => {
  return (
    <>
      <div className="page">
        <div className="flex flex-row overflow-hidden">{children}</div>
        <div className="cursor"></div>
      </div>
    </>
  );
};
export default Layout;
