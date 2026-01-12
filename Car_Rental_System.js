class CarNotAvailableError extends Error {
    constructor(message) {
        super(message);
        this.name = "CarNotAvailableError";
    }
}
class InvalidRentalDurationError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidRentalDurationError";
    }
}
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
const validationHelpers = {
    validateMake(value) {
        return typeof value === "string" && !!value.trim();
    },
    validateModel(value) {
        return typeof value === "string" && !!value.trim();
    },
    isPositiveNumber(value) {
        return Number.isFinite(value) && value > 0;
    },
    validateName(value) {
        return typeof value === "string" && !!value.trim();
    },
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
    validateCustomer(value) {
        return value instanceof Customer;
    },
    validateCar(value) {
        return value instanceof Car;
    },
    validateSeason(value) {
        return value instanceof Season;
    },
    isValidSeasonName(value) {
        return (
            typeof value === "string" &&
            (value === "autumn" ||
                value === "spring" ||
                value === "summer" ||
                value === "winter")
        );
    },
};
class Rental {
    static #uniqueID = 0;
    constructor(customer, car, rentalDuration) {
        if (!validationHelpers.validateCustomer(customer)) {
            throw new ValidationError("customer must be instance of Customer class");
        }
        if (!validationHelpers.validateCar(car)) {
            throw new ValidationError("car must be instance of Car class");
        }
        if (!validationHelpers.isPositiveNumber(rentalDuration)) {
            throw new ValidationError("rental duration must be positive number");
        }
        this.rentalDuration = rentalDuration;
        if (
            car instanceof EconomyCar &&
            this.rentalDuration < car.minRentDurationDays
        ) {
            throw new InvalidRentalDurationError(
                "Economy cars rent duration must be minimum 30 days"
            );
        }
        if (
            car instanceof LuxuryCar &&
            this.rentalDuration > car.maxRentDurationDays
        ) {
            throw new InvalidRentalDurationError(
                "Luxury cars rent duration must be maximum 3 days"
            );
        }
        this.customer = customer;
        this.car = car;
        this.rentalID = Rental.#uniqueID++;
        customer.rentalHistory.push(this);
    }
    rentCar() {
        this.car.markRented();
    }
    returnCar() {
        this.car.markAvailable();
    }
    calculateRentalPrice(season) {
        if (!validationHelpers.validateSeason(season)) {
            throw new ValidationError("Season must be instance of Season class");
        }
        let changedPrice = this.car.rentalPricePerDay;
        if (season.name === "winter") {
            changedPrice = changedPrice * (1 + season.percent / 100);
            console.log("Car price is increasing with 15% because of winter");
        } else if (season.name === "spring") {
            changedPrice -= changedPrice * (1 - season.percent / 100);
            console.log("Car price is lacking with 10% because of spring");
        } else if (season.name === "summer") {
            changedPrice = changedPrice * (1 - season.percent / 100);
            console.log("Car price is lacking with 15% because of summer");
        } else {
            changedPrice = changedPrice * (1 + season.percent / 100);
            console.log("Car price is increasing with 10% because of autumn");
        }
        return this.rentalDuration * changedPrice;
    }
}
class RentalService {
    constructor() {
        this.cars = [];
        this.rentals = [];
    }
    addCar(car) {
        if (!validationHelpers.validateCar(car)) {
            throw new ValidationError("Invalid car");
        }
        this.cars.push(car);
    }
    addRental(rental) {
        if (!(rental instanceof Rental)) {
            throw new ValidationError("Invalid rental");
        }
        rental.rentCar();
        this.rentals.push(rental);
    }
    searchCars(filters = {}) {
        return this.cars.filter((car) => {
            if (filters.make && car.make !== filters.make) return false;
            if (filters.model && car.model !== filters.model) return false;
            if (filters.minPrice && car.rentalPricePerDay < filters.minPrice)
                return false;
            if (
                typeof filters.available === "boolean" &&
                car.isAvailable !== filters.available
            ) {
                return false;
            }
            if (filters.type === "Economy" && !(car instanceof EconomyCar))
                return false;
            if (filters.type === "Luxury" && !(car instanceof LuxuryCar))
                return false;
            return true;
        });
    }
}
class Car {
    #availability = true;
    constructor(make, model, rentalPricePerDay) {
        if (!validationHelpers.validateMake(make)) {
            throw new ValidationError("Make must be non-empty string");
        }
        if (!validationHelpers.validateModel(model)) {
            throw new ValidationError("Model must be non-empty string");
        }
        if (!validationHelpers.isPositiveNumber(rentalPricePerDay)) {
            throw new ValidationError("price must be positive number");
        }
        this.make = make;
        this.model = model;
        this.rentalPricePerDay = rentalPricePerDay;
    }
    get isAvailable() {
        return this.#availability;
    }
    markRented() {
        if (!this.#availability) {
            throw new CarNotAvailableError("Car is already rented");
        }
        this.#availability = false;
    }
    markAvailable() {
        if (this.#availability) {
            throw new ValidationError("Car is already available");
        }
        this.#availability = true;
    }
}
class EconomyCar extends Car {
    constructor(make, model, rentalPricePerDay) {
        super(make, model, rentalPricePerDay);
        this.minRentDurationDays = 30;
    }
}
class LuxuryCar extends Car {
    constructor(make, model, rentalPricePerDay) {
        super(make, model, rentalPricePerDay);
        this.maxRentDurationDays = 3;
    }
}
class Customer {
    constructor(name, contactInfo) {
        if (!validationHelpers.validateName(name)) {
            throw new ValidationError("name must be non-empty string");
        }
        if (!validationHelpers.validateContactInfo(contactInfo)) {
            throw new ValidationError("Invalid contact info");
        }
        this.name = name;
        this.contactInfo = contactInfo;
        this.rentalHistory = [];
    }
    searchCars(rentalService, filters) {
        if (!(rentalService instanceof RentalService)) {
            throw new ValidationError("Invalid rental service");
        }
        return rentalService.searchCars(filters);
    }
    viewRentalHistory() {
        return [...this.rentalHistory];
    }
}
class Season {
    constructor(name, percent) {
        if (!validationHelpers.isValidSeasonName(name)) {
            throw new ValidationError(
                "Season name must be string and autumn,winter,summer or spring"
            );
        }
        if (!validationHelpers.isPositiveNumber(percent)) {
            throw new ValidationError("Percent must be finite number");
        }
        this.name = name;
        this.percent = percent;
    }
}