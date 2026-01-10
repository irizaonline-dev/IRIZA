$token = 'xbFLPz3h2suGj8AxQ28E98qF'
$team = 'team_0uZD7wI3nukBcySRBKU0hPr1'
$projName = 'iriza-site'
$mongo = 'mongodb+srv://<YOUR_USER>:<YOUR_PASS>@cluster0.mongodb.net/iriza?retryWrites=true&w=majority'
$jwt = 'Testing@12'

Write-Output "Finding project $projName in team $team..."
$resp = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects?teamId=$team" -Headers @{ Authorization = "Bearer $token" }
$proj = $resp.projects | Where-Object { $_.name -eq $projName }
if (-not $proj) { Write-Error 'Project not found'; exit 2 }
$pid = $proj.id
Write-Output "ProjectId: $pid"

Write-Output 'Setting MONGO_URI...'
Invoke-RestMethod -Method Post -Uri "https://api.vercel.com/v9/projects/$pid/env" -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } -Body (ConvertTo-Json @{ key = 'MONGO_URI'; value = $mongo; target = @('production') })
Write-Output 'MONGO_URI set'

Write-Output 'Setting JWT_SECRET...'
Invoke-RestMethod -Method Post -Uri "https://api.vercel.com/v9/projects/$pid/env" -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } -Body (ConvertTo-Json @{ key = 'JWT_SECRET'; value = $jwt; target = @('production') })
Write-Output 'JWT_SECRET set'

Write-Output 'Done.'
