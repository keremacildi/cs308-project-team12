import random
import json
import js2py

# Load products from a JavaScript file
with open("products.js", "r") as file:
    js_code = file.read()

# Convert JavaScript to Python dictionary
products = js2py.eval_js(js_code)

# Ensure products is a list
if not isinstance(products, list):
    raise ValueError("Parsed products data is not a list")

# Add random rating from 0 to 5
def add_random_ratings(products):
    for product in products:
        product["rating"] = round(random.uniform(0, 5), 1)  # Generates a random float between 0 and 5 with 1 decimal place
    return products

# Update products with ratings
updated_products = add_random_ratings(products)

# Save updated products back to a JSON file
with open("updated_products.json", "w") as file:
    json.dump(updated_products, file, indent=4)

# Print updated products
for product in updated_products:
    print(product)
