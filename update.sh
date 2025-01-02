# Get formatted date (hh:mm:ss dd.mm.yyyy)
date_formatted=$(date "+%H:%M:%S %d.%m.%Y")
git add .
git commit -a -m "Auto update ${date_formatted}"
git push
git pull
