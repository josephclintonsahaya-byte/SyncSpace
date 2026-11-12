
function Navbar(props) {
  return (
    <nav>
      <h1>{props.heading}</h1>
      <p>WELCOME, {props.username}!</p>
      <button>{props.button}</button>
    </nav>
  );
}

export default Navbar;
