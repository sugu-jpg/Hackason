
import LogOutButton from '@/components/header/logOutButton';


export default function Layout({ children }: { children: React.ReactNode }) {


  return (
    <div>
      <LogOutButton />
      {children}
    </div>
  );
}