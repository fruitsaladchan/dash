export function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  return `${(bytes / (1024 ** i)).toFixed(2)} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSecond) {
  if (bytesPerSecond === 0) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(1024));
  return `${(bytesPerSecond / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
} 