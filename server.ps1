$port = 8080
$folder = $PSScriptRoot

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -First 1).IPAddress
if (-not $ip) { $ip = "localhost" }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
if ($ip -ne "localhost") {
    try {
        $listener.Prefixes.Add("http://$($ip):$port/")
    } catch {
        # ignore if already bound
    }
}

try {
    $listener.Start()
    Write-Host "========================================================"
    Write-Host "  MEIMEII Love Galaxy Server is Running!"
    Write-Host "========================================================"
    Write-Host ""
    Write-Host "Open on iPad / Mobile (same Wi-Fi):"
    Write-Host "http://$($ip):$port/"
    Write-Host ""
    Write-Host "Open on this PC:"
    Write-Host "http://localhost:$port/"
    Write-Host "========================================================"
    Write-Host ""

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq "/" -or $path -eq "") {
            $path = "/index.html"
        }

        $localPath = Join-Path $folder $path.TrimStart('/')
        if (Test-Path $localPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            switch ($ext) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                ".png"  { $response.ContentType = "image/png" }
                ".svg"  { $response.ContentType = "image/svg+xml" }
                ".mp3"  { $response.ContentType = "audio/mpeg" }
                ".m4a"  { $response.ContentType = "audio/mp4" }
                default { $response.ContentType = "application/octet-stream" }
            }
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.OutputStream.Close()
    }
} catch {
    Write-Host "Server error: $_"
}
