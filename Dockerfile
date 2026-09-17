FROM 192.168.18.100:5000/nginx:stable-alpine

COPY index.html /usr/share/nginx/html/index.html
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY images/scrape/*.jpg /usr/share/nginx/html/images/scrape/
COPY images/fair_clouds_4k.png images/galaxy_starfield.png /usr/share/nginx/html/images/
COPY LICENSE /usr/share/doc/ancient-earth/LICENSE

EXPOSE 80
