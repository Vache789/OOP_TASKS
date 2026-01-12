class InsufficientFundsError extends Error {
    constructor(m) {
        super(m);
        this.name = "InsufficientFundsError";
    }
}
class InvalidTransactionError extends Error {
    constructor(m) {
        super(m);
        this.name = "InvalidTransactionError";
    }
}
class AuthorizationError extends Error {
    constructor(m) {
        super(m);
        this.name = "AuthorizationError";
    }
}
class ValidationError extends Error {
    constructor(m) {
        super(m);
        this.name = "ValidationError";
    }
}
const validationHelpers = {
    validateAccountNumber(value) {
        return typeof value === "string" && value.length === 10;
    },
    isNonNegative(value) {
        return typeof value === "number" && value >= 0;
    },
    validateName(value) {
        return value.length;
    },
    validateEmail(value) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(value);
    },
    validateTransactionType(value) {
        return (
            typeof value == "string" &&
            (value === "deposit" || value === "withdraw" || value === "transfer")
        );
    },
    validateAmount(value) {
        typeof value === "number" && Number.isFinite(value) && value > 0;
    },
};
class BankAccount {
    #balance = 0;
    #transactions = [];
    constructor(accountNumber, type, balance = 0) {
        if (new.target == BankAccount) {
            throw new TypeError("Abstract class can not have instances");
        }
        if (!validationHelpers.validateAccountNumber(accountNumber)) {
            throw new ValidationError("Account number must exactly 10 digits");
        }
        this.accountNumber = accountNumber;
        this.type = type;
        this.balance = balance;
    }
    deposit(amount) {
        throw new TypeError("Abstract method must be implement by subclass");
    }
    withdraw(amount) {
        throw new TypeError("Abstract method must be implement by subclass");
    }
    getAllTransactions() {
        return [...this.#transactions];
    }
    getTransactionSummary(limit = 10) {
        if (this.#transactions.length < limit) {
            this.getAllTransactions();
        }
        return this.#transactions.slice(-limit);
    }
    addTransaction(transaction) {
        if (!(transaction instanceof Transaction)) {
            throw new ValidationError(
                "transaction must be instance of Transaction class"
            );
        }
        this.#transactions.push(transaction);
    }
    set balance(value) {
        if (!validationHelpers.isNonNegative(value)) {
            throw new ValidationError("Balance must be positive number");
        }
        this.#balance = value;
    }
    getBalance() {
        this.#balance;
    }
}
class JointAccount extends BankAccount {
    #owners = [];
    constructor(accountNumber, balance, ...owners) {
        super(accountNumber, "joint", balance);
        this.#owners = owners;
    }
    get owners() {
        return this.#owners;
    }
    deposit(amount) {
        if (!validationHelpers.validateAmount(amount)) {
            throw new ValidationError("Amount must be number");
        }
        const date = Date.now().toString();
        this.balance += amount;
        this.addTransaction(
            new Transaction(this.accountNumber, amount, "deposit", date)
        );
    }
    withdraw(amount) {
        if (!validationHelpers.validateAmount(amount)) {
            throw new ValidationError("Amount must be number");
        }
        const date = Date.now().toString();
        if (this.getBalance() < amount) {
            throw new InsufficientFundsError("Insufficient Funds");
        }
        this.balance -= amount;
        this.addTransaction(
            new Transaction(this.accountNumber, amount, "withdraw", date)
        );
    }
    transferFunds(targetAccount, amount, actor) {
        if (!(targetAccount instanceof BankAccount)) {
            throw new ValidationError("Target account is not instance of Bank");
        }
        if (!validationHelpers.validateAmount(amount)) {
            throw new ValidationError("Amount must be number");
        }
        if (this.balance < amount) {
            throw new InsufficientFundsError("InsufficientFundsError");
        }
        for (const person of this.owners) {
            if (actor === person) {
                const date = Date.now().toString();
                this.balance -= amount;
                targetAccount.deposit(amount);
                this.addTransaction(
                    new Transaction(
                        this.accountNumber,
                        amount,
                        "transfer",
                        date,
                        this.accountNumber,
                        targetAccount.accountNumber
                    )
                );
                return;
            }
        }
        throw new AuthorizationError("Invalid actor");
    }
}
class IndividualAccount extends BankAccount {
    constructor(accountNumber, balance) {
        super(accountNumber, "individual", balance);
    }
    transferFunds(targetAccount, amount, actor) {
        if (!(targetAccount instanceof BankAccount)) {
            throw new ValidationError("Target account is not instance of Bank");
        }
        if (!validationHelpers.validateAmount(amount)) {
            throw new ValidationError("Amount must be positive number");
        }
        if (this.balance < amount) {
            throw new InsufficientFundsError("Insufficient Funds");
        }
        const date = Date.now().toString();
        this.balance -= amount;
        targetAccount.deposit(amount);
        this.addTransaction(
            new Transaction(
                this.accountNumber,
                amount,
                "transfer",
                date,
                this.accountNumber,
                targetAccount.accountNumber
            )
        );
    }
}
class Customer {
    constructor(name, contactInfo) {
        let _name;
        let _contactInfo;
        Object.defineProperty(this, "name", {
            set(value) {
                if (!validationHelpers.validateName(value)) {
                    throw new TypeError("Name must be non-empty string");
                }
                _name = value;
            },
            get() {
                return _name;
            },
        });
        Object.defineProperty(this, "contactInfo", {
            set(value) {
                if (!validationHelpers.validateEmail(value)) {
                    throw new ValidationError("contact info must be email");
                }
                _contactInfo = value;
            },
            get() {
                return _contactInfo;
            },
        });
        this.name = name;
        this.contactInfo = contactInfo;
        this.accounts = [];
    }
    addAccount(account) {
        this.accounts.push(account);
    }
    viewAccounts() {
        return this.accounts;
    }
    viewTransactionHistory(accountNumber) {
        const acc = this.accounts.find((a) => a.accountNumber === accountNumber);
        if (!acc) throw new ValidationError("Account not found");
        return acc.getAllTransactions();
    }
}
class Transaction {
    constructor(
        accountNumber,
        amount,
        transactionType,
        timestamp,
        fromAccount,
        toAccount
    ) {
        let _type;
        let _amount;
        let _account;
        Object.defineProperty(this, "transactionType", {
            set(value) {
                if (!validationHelpers.validateTransactionType(value)) {
                    throw new ValidationError(
                        "Transaction Type must be deposit,withdraw or transfer"
                    );
                }
                _type = value;
            },
            get() {
                return _type;
            },
        });
        Object.defineProperty(this, "amount", {
            set(value) {
                if (!validationHelpers.isNonNegative(value)) {
                    throw new ValidationError(
                        "Transaction amount must be positive number"
                    );
                }
                _amount = value;
            },
            get() {
                return _amount;
            },
        });
        Object.defineProperty(this, "accountNumber", {
            set(value) {
                if (!validationHelpers.validateAccountNumber(value)) {
                    throw new ValidationError(
                        "Account number must be string exactly 10 digits"
                    );
                }
                _account = value;
            },
            get() {
                return _account;
            },
        });
        if (fromAccount) {
            this.fromAccount = fromAccount;
        }
        if (toAccount) {
            this.toAccount = toAccount;
        }
        this.timestamp = timestamp;
        this.amount = amount;
        this.accountNumber = accountNumber;
        this.transactionType = transactionType;
    }
}