import DragonIcon from "./DragonIcon";

export default function Layout({ children }) {
  return (
    <div className="text-center bg-pink-300 min-h-screen flex flex-col items-center justify-center font-spectral">
      <div className=" bg-white p-8 w-full max-w-xl">
        <DragonIcon />
        {children}
      </div>
    </div>
  );
}
