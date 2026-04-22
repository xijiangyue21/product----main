# Spring Boot Backend

This folder contains the active Java backend for StockPulse.

## Run on Windows

```powershell
cd E:\stockwork\product----main\product----main\backend-java
mvn spring-boot:run
```

## Run with Script Wrapper

```powershell
cd E:\stockwork\product----main\product----main\backend-java
.\run-backend.ps1
```

## Run Full Stack From Root

```powershell
cd E:\stockwork\product----main\product----main
.\run-dev.ps1
```

This starts:

- Spring Boot backend
- React frontend

## Environment

The backend reads the same root `.env` values:

- `DATABASE_URL`
- `DB_SSL`
- `JWT_SECRET`
- `PORT`

## Notes

- The backend port is controlled by `application.yml`
- The frontend now targets this backend directly
