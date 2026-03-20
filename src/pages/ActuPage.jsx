import ActuTab from '../components/ActuTab';
import MainHeaderFull from '../components/MainHeaderFull';

export default function ActuPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeaderFull />
      <div className="pt-[120px] pb-24 px-3 max-w-lg mx-auto">
        <ActuTab />
      </div>
    </div>
  );
}
