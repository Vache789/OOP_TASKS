class DishNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "DishNotFoundError";
    }
}

class InvalidOrderError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidOrderError";
    }
}

class VlidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError"
    }
}

const validationHelpers = {

    validateContactInfo(value) {
        if (typeof value !== "string") return false;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const phoneRegex = /^\+?[1-9][0-9]{7,14}$/;
        if (!emailRegex.test(value)) {
            if (!phoneRegex.test(value)) {
                return false;
            }
        }
        return true;
    },
    isValidString(value) {
        return typeof value === "string" && value.trim().length > 0;
    },
    isNonNegative(value) {
        return typeof value === "number" && value > 0;
    },
}

class Dish {
    constructor(name,price) {

        if (!validationHelpers.isValidString()) {
            throw new ValidationError("name must be non-empty string");
        }

        if (!validationHelpers.isNonNegative()) {
            throw new ValidationError("must be positive number");   
        }

        this.name = name;
        this.price = price;
    }
}

class Appetizer extends Dish {
    constructor(name,price) {
        super(name,price);

        
    }
}