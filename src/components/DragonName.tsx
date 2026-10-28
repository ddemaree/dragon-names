type Props = {
  name: string;
  dragonType: string;
};

export default function DragonName({ name, dragonType }: Props) {
  return (
    <div className="border-t border-b border-pink-500 mb-8 p-4">
      <p>Your dragon's name is:</p>
      <p className="mt-3 text-xl font-spectral-sc">{name}</p>
      <p className="my-3">and they are a</p>
      <p className="mt-3 text-xl font-spectral-sc">{dragonType}</p>
    </div>
  );
}
