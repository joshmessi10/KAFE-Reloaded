param([int]$OwnedRootPid, [string]$OwnedRootPath, [switch]$ValidateOnly, [ValidateRange(640,1920)][int]$Width=1024, [ValidateRange(480,1200)][int]$Height=768)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class KafeOwnedWindow {
  public delegate bool EnumProc(IntPtr hwnd, IntPtr data);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc callback, IntPtr data);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint processId);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hwnd, int command);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hwnd);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hwnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);
  public static long[] Handles() { var result = new List<long>(); EnumWindows((hwnd, data) => { result.Add(hwnd.ToInt64()); return true; }, IntPtr.Zero); return result.ToArray(); }
}
"@
if ($ValidateOnly) { Write-Output 'Owned HWND helper compiled; no window inspected or changed.'; exit 0 }
$resolvedRoot = [IO.Path]::GetFullPath($OwnedRootPath)
if ([IO.Path]::GetDirectoryName($resolvedRoot).TrimEnd('\') -ne [IO.Path]::GetFullPath($env:TEMP).TrimEnd('\') -or -not [IO.Path]::GetFileName($resolvedRoot).StartsWith('kafe-native-owned-')) { throw 'Invalid owned native root' }
function Get-OwnedProcessIds {
  $processes = @(Get-CimInstance Win32_Process)
  $main = $processes | Where-Object { $_.ProcessId -eq $OwnedRootPid }
  if (-not $main -or -not $main.CommandLine -or -not $main.CommandLine.Contains($resolvedRoot)) { throw 'Native root PID identity changed or missing' }
  $ids = [Collections.Generic.HashSet[uint32]]::new()
  [void]$ids.Add([uint32]$OwnedRootPid)
  do {
    $added = $false
    foreach ($item in $processes) { if ($ids.Contains([uint32]$item.ParentProcessId) -and $ids.Add([uint32]$item.ProcessId)) { $added = $true } }
  } while ($added)
  return ,$ids
}
$deadline = [DateTime]::UtcNow.AddSeconds(15)
$found = $null
while ([DateTime]::UtcNow -lt $deadline) {
  $ids = Get-OwnedProcessIds
  $candidates = @()
  $ownedWindows = @()
  foreach ($value in [KafeOwnedWindow]::Handles()) {
    $hwnd = [IntPtr]$value
    [uint32]$windowOwner = 0
    [void][KafeOwnedWindow]::GetWindowThreadProcessId($hwnd, [ref]$windowOwner)
    if (-not $ids.Contains($windowOwner)) { continue }
    $rect = New-Object KafeOwnedWindow+RECT
    [void][KafeOwnedWindow]::GetWindowRect($hwnd, [ref]$rect)
    $visible = [KafeOwnedWindow]::IsWindowVisible($hwnd)
    $ownedWindows += @{handle=$value; owner=$windowOwner; visible=$visible; width=($rect.Right-$rect.Left); height=($rect.Bottom-$rect.Top)}
    if ($visible -and ($rect.Right-$rect.Left) -gt 200 -and ($rect.Bottom-$rect.Top) -gt 200) { $candidates += @{handle=$value; owner=$windowOwner; originalVisible=$visible; originalWidth=($rect.Right-$rect.Left); originalHeight=($rect.Bottom-$rect.Top)} }
  }
  if ($candidates.Count -eq 1) { $found = $candidates[0]; break }
  if ($candidates.Count -gt 1) { throw 'Multiple visible owned windows; refusing ambiguous resize' }
  Start-Sleep -Milliseconds 200
}
if (-not $found) {
  $hidden = @($ownedWindows | Where-Object { -not $_.visible -and $_.width -gt 200 -and $_.height -gt 200 })
  if ($hidden.Count -eq 1) { $found = @{ handle=$hidden[0].handle; owner=$hidden[0].owner; originalVisible=$false; originalWidth=$hidden[0].width; originalHeight=$hidden[0].height } }
}
if (-not $found) { @{rootPid=$OwnedRootPid; ownedProcessIds=@($ids); ownedWindows=$ownedWindows; status='no-visible-owned-window'} | ConvertTo-Json -Depth 5; throw 'No visible top-level HWND in owned native process tree within 15 seconds' }
$ids = Get-OwnedProcessIds
[uint32]$currentOwner = 0
$target = [IntPtr]$found.handle
[void][KafeOwnedWindow]::GetWindowThreadProcessId($target, [ref]$currentOwner)
if ($currentOwner -ne $found.owner -or -not $ids.Contains($currentOwner)) { throw 'Owned window identity changed before resize' }
if (-not [KafeOwnedWindow]::IsWindowVisible($target)) { [void][KafeOwnedWindow]::ShowWindow($target, 9) }
if (-not [KafeOwnedWindow]::IsWindowVisible($target)) { throw 'Owned HWND did not become visible after restore' }
if (-not [KafeOwnedWindow]::SetWindowPos($target, [IntPtr]::Zero, 0, 0, $Width, $Height, 0x0006)) { throw 'Owned window resize failed' }
$rect = New-Object KafeOwnedWindow+RECT
[void][KafeOwnedWindow]::GetWindowRect($target, [ref]$rect)
@{ originalVisible=$found.originalVisible; originalWidth=$found.originalWidth; originalHeight=$found.originalHeight; visible=[KafeOwnedWindow]::IsWindowVisible($target); ownedWindows=$ownedWindows; rootPid=$OwnedRootPid; ownerPid=$currentOwner; hwnd=$found.handle; processIds=@($ids); left=$rect.Left; top=$rect.Top; width=($rect.Right-$rect.Left); height=($rect.Bottom-$rect.Top) } | ConvertTo-Json -Depth 3
