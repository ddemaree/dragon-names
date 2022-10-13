import { useState } from "react";

export default function HomePage() {
  const [name, setName] = useState(null);
  const [dragonType, setDragonType] = useState(null);

  function getDragonName(event) {
    fetch("/api/names")
      .then((response) => response.json())
      .then((responseData) => {
        setName(responseData.name);
        setDragonType(responseData.type);
      });
  }

  return (
    <div className="text-center bg-pink-300 min-h-screen flex flex-col items-center justify-center font-spectral">
      <div className=" bg-white p-4 w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">June's Dragon Generator</h1>
        <button
          onClick={getDragonName}
          className="bg-pink-600 text-white font-bold p-3"
        >
          Make me {name ? "another" : "a"} dragon
        </button>

        {name && (
          <div className="border-t border-pink-500 mt-4 p-4">
            <p>Your dragon's name is:</p>
            <p className="mt-3 text-xl font-spectral-sc">{name}</p>
            <p className="my-3">and they are a</p>
            <p className="mt-3 text-xl font-spectral-sc">{dragonType}</p>
          </div>
        )}
      </div>
    </div>
  );
}
