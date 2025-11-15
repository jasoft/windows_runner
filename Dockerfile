# escape=`
FROM mcr.microsoft.com/windows/servercore:ltsc2022 AS base

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]

ENV NODE_VERSION=20.11.1

RUN Invoke-WebRequest -UseBasicParsing "https://nodejs.org/dist/v$env:NODE_VERSION/node-v$env:NODE_VERSION-win-x64.zip" -OutFile node.zip ; \
    Expand-Archive node.zip -DestinationPath C:\node ; \
    Remove-Item node.zip -Force ; \
    setx /M PATH "$env:Path;C:\\node\\node-v$env:NODE_VERSION-win-x64"

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist ./dist

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]
