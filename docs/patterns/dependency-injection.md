# Dependency injection

Паттерн проектирования, который позволяет внедрять зависимости между экземплярами классов в приложении. Зависисость

Разница между режимами инъекцией `CLASSIC` и `PROXY`. Я использую библиотеку `awilix` для удобного управления зависимостей

### Proxy

Это когда внедряем объект зависимостей, у которых ключ является ключом регистрации контейнере

```typescript
export class EmailService {}
export class AuthService {}

export class UserService {
  private emailService: EmailService;
  private authService: AuthService;

  constructor(
    dependencies: { emailService: EmailService; authService: AuthService } = {
      emailService,
      authService,
    }
  ) {
    this.emailService = emailService;
    this.authService = .authService;
  }
}
```

### Classic

Это когда в констукторе описываем зависимости из контейнера, у которых ключ является ключом регистрации контейнере. Обычно я использую этот режим инъекции, он синтаксически проще

```typescript
export class EmailService {}
export class AuthService {}
export class GoogleService {}

export class UserService {
  constructor(
    private emailService: EmailService,
    private authService: AuthService,
    private googleService: GoogleService
  ) {
    /**
     * emailService,  authService, googleService - являются "токенами",
     * по которым можно будет достать зарегестрированный экземпляр в контейнере
     */
  }
}
```
