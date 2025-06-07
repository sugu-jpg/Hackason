
import LogOutButton from '@/components/header/logOutButton';


export default function Layout({ children }: { children: React.ReactNode }) {


  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      {/* ログアウトボタンを固定位置に配置 */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000
      }}>
        <LogOutButton />
      </div>
      
      {/* コンテンツエリア */}
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}