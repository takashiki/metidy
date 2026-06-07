import { useState } from 'react';
import { Cloud, LogIn, LogOut, RefreshCw, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  clearSyncAuth,
  isSyncConfigured,
  loginForSync,
  registerForSync,
  syncNow,
} from '../../services/syncService';

type SyncMode = 'login' | 'register';

export function SyncManager() {
  const [mode, setMode] = useState<SyncMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [deviceName, setDeviceName] = useState(navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop');
  const [configured, setConfigured] = useState(isSyncConfigured());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(configured ? '已连接云端同步' : '未连接云端同步');

  async function submitAuth() {
    setBusy(true);
    setMessage('正在连接...');
    try {
      if (mode === 'register') {
        await registerForSync({ email, password, name, device_name: deviceName });
      } else {
        await loginForSync({ email, password, device_name: deviceName });
      }
      setConfigured(true);
      setMessage('已连接云端同步');
      await syncNow();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '连接失败');
    } finally {
      setBusy(false);
    }
  }

  async function runSync() {
    setBusy(true);
    setMessage('正在同步...');
    try {
      await syncNow();
      setMessage('同步完成');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '同步失败');
    } finally {
      setBusy(false);
    }
  }

  function disconnect() {
    clearSyncAuth();
    setConfigured(false);
    setMessage('未连接云端同步');
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-md border p-4">
        <div className="flex items-center gap-3">
          <Cloud className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="font-medium">云端同步</div>
            <div className="text-sm text-muted-foreground">{message}</div>
          </div>
        </div>
        {configured ? (
          <Button variant="outline" size="icon" onClick={disconnect} disabled={busy} title="断开连接">
            <LogOut className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {configured ? (
        <Button onClick={runSync} disabled={busy}>
          <RefreshCw className="h-4 w-4" />
          立即同步
        </Button>
      ) : (
        <div className="space-y-4 rounded-md border p-4">
          <div className="inline-flex rounded-md border p-1">
            <Button
              type="button"
              variant={mode === 'login' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('login')}
            >
              <LogIn className="h-4 w-4" />
              登录
            </Button>
            <Button
              type="button"
              variant={mode === 'register' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('register')}
            >
              <UserPlus className="h-4 w-4" />
              注册
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sync-email">邮箱</Label>
            <Input id="sync-email" type="email" value={email} onChange={event => setEmail(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sync-password">密码</Label>
            <Input
              id="sync-password"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </div>
          {mode === 'register' ? (
            <div className="space-y-2">
              <Label htmlFor="sync-name">名称</Label>
              <Input id="sync-name" value={name} onChange={event => setName(event.target.value)} />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="sync-device">设备名</Label>
            <Input
              id="sync-device"
              value={deviceName}
              onChange={event => setDeviceName(event.target.value)}
            />
          </div>
          <Button onClick={submitAuth} disabled={busy || !email || password.length < 8}>
            {mode === 'register' ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {mode === 'register' ? '注册并同步' : '登录并同步'}
          </Button>
        </div>
      )}
    </div>
  );
}
