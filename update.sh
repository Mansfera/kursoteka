# Get formatted date (ss:mm:hh dd.mm.yyyy)
date_formatted=$(date "+%S:%M:%H %d.%m.%Y")
git commit -a -m "Auto update ${date_formatted}"
git push
git pull