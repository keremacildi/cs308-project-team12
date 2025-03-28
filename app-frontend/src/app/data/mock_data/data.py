import re

# Original mockProducts data as a string (simulating the format you're using)
mock_products_str = '''
export const mockProducts = {
    product: [
            { id: 1, title: "iPhone 15", price: 999, image: "/iphone.jpg", category: "Electronics", brand: "Apple", seller: "Amazon", rating: 4.5, stock: 50 },
            { id: 2, title: "MacBook Pro", price: 1999, image: "/macbook.jpg", category: "Electronics", brand: "Apple", seller: "eBay", rating: 4.7, stock: 30 },
            { id: 3, title: "Nike Shoes", price: 120, image: "/nike-shoes.jpg", category: "Clothing", brand: "Nike", seller: "Amazon", rating: 4.3, stock: 100 },
            { id: 4, title: "Smartwatch", price: 199, image: "/smartwatch.jpg", category: "Electronics", brand: "Apple", seller: "eBay", rating: 4.6, stock: 75 },
            { id: 5, title: "Samsung Galaxy S23", price: 899, image: "/galaxy-s23.jpg", category: "Electronics", brand: "Samsung", seller: "BestBuy", rating: 4.4, stock: 60 },
            { id: 6, title: "Sony Headphones", price: 299, image: "/sony-headphones.jpg", category: "Electronics", brand: "Sony", seller: "Amazon", rating: 4.8, stock: 80 },
            { id: 7, title: "LG OLED TV", price: 1500, image: "/lg-oled-tv.jpg", category: "Electronics", brand: "LG", seller: "Walmart", rating: 4.7, stock: 40 },
            { id: 8, title: "Adidas Running Shoes", price: 130, image: "/adidas-shoes.jpg", category: "Clothing", brand: "Adidas", seller: "eBay", rating: 4.2, stock: 120 },
            { id: 9, title: "Dell XPS 15", price: 2200, image: "/dell-xps.jpg", category: "Electronics", brand: "Dell", seller: "Newegg", rating: 4.6, stock: 25 },
            { id: 10, title: "HP Spectre x360", price: 1800, image: "/hp-spectre.jpg", category: "Electronics", brand: "HP", seller: "Amazon", rating: 4.5, stock: 50 },
            { id: 11, title: "Bose Bluetooth Speaker", price: 250, image: "/bose-speaker.jpg", category: "Electronics", brand: "Bose", seller: "BestBuy", rating: 4.7, stock: 65 },
            { id: 12, title: "AmazonBasics Backpack", price: 40, image: "/amazon-basics-backpack.jpg", category: "Accessories", brand: "AmazonBasics", seller: "Amazon", rating: 4.1, stock: 200 },
            { id: 13, title: "Puma Jacket", price: 100, image: "/puma-jacket.jpg", category: "Clothing", brand: "Puma", seller: "Target", rating: 4.0, stock: 90 },
            { id: 14, title: "Microsoft Surface Laptop", price: 1600, image: "/surface-laptop.jpg", category: "Electronics", brand: "Microsoft", seller: "BestBuy", rating: 4.4, stock: 35 },
            { id: 15, title: "Lenovo ThinkPad X1", price: 1700, image: "/thinkpad-x1.jpg", category: "Electronics", brand: "Lenovo", seller: "Walmart", rating: 4.5, stock: 45 },
            { id: 16, title: "Canon DSLR Camera", price: 1200, image: "/canon-dslr.jpg", category: "Electronics", brand: "Canon", seller: "Newegg", rating: 4.6, stock: 55 },
            { id: 17, title: "Philips Air Fryer", price: 180, image: "/philips-air-fryer.jpg", category: "Home Appliances", brand: "Philips", seller: "Amazon", rating: 4.3, stock: 110 },
            { id: 18, title: "Nike Sports Bag", price: 75, image: "/nike-bag.jpg", category: "Accessories", brand: "Nike", seller: "eBay", rating: 4.2, stock: 150 },
            { id: 19, title: "Sony PlayStation 5", price: 499, image: "/ps5.jpg", category: "Electronics", brand: "Sony", seller: "BestBuy", rating: 4.9, stock: 20 },
            { id: 20, title: "Samsung Smart Refrigerator", price: 2200, image: "/samsung-fridge.jpg", category: "Home Appliances", brand: "Samsung", seller: "Costco", rating: 4.7, stock: 10 },
            { id: 21, title: "LG Washing Machine", price: 800, image: "/lg-washer.jpg", category: "Home Appliances", brand: "LG", seller: "HomeDepot", rating: 4.3, stock: 60 },
            { id: 22, title: "Apple AirPods Pro", price: 250, image: "/airpods-pro.jpg", category: "Electronics", brand: "Apple", seller: "Amazon", rating: 4.8, stock: 50 },
            { id: 23, title: "Dell Gaming Monitor", price: 500, image: "/dell-monitor.jpg", category: "Electronics", brand: "Dell", seller: "Newegg", rating: 4.6, stock: 70 },
            { id: 24, title: "HP Laser Printer", price: 350, image: "/hp-printer.jpg", category: "Electronics", brand: "HP", seller: "eBay", rating: 4.4, stock: 80 },
            { id: 25, title: "Bose Noise Cancelling Headphones", price: 400, image: "/bose-nc.jpg", category: "Electronics", brand: "Bose", seller: "Amazon", rating: 4.9, stock: 60 },
            { id: 26, title: "Gaming Chair", price: 250, image: "/gaming-chair.jpg", category: "Furniture", brand: "Secretlab", seller: "BestBuy", rating: 4.5, stock: 0 },
            { id: 27, title: "Sony 4K HDR TV", price: 1200, image: "/sony-4k-tv.jpg", category: "Electronics", brand: "Sony", seller: "Target", rating: 4.7, stock: 45 },
            { id: 28, title: "Nike Running Shoes", price: 110, image: "/nike-running.jpg", category: "Clothing", brand: "Nike", seller: "eBay", rating: 4.2, stock: 90 },
            { id: 29, title: "Logitech Wireless Mouse", price: 60, image: "/logitech-mouse.jpg", category: "Accessories", brand: "Logitech", seller: "Amazon", rating: 4.3, stock: 150 },
            { id: 30, title: "Razer Mechanical Keyboard", price: 140, image: "/razer-keyboard.jpg", category: "Electronics", brand: "Razer", seller: "Newegg", rating: 4.6, stock: 0 },
            { id: 31, title: "Gaming Laptop", price: 1499, image: "/gaming-laptop.jpg", category: "Electronics", brand: "Dell", seller: "Amazon", rating: 4.5, stock: 20 },
            { id: 32, title: "Wireless Headphones", price: 299, image: "/headphones.jpg", category: "Electronics", brand: "Sony", seller: "eBay", rating: 4.8, stock: 55 },
            { id: 33, title: "Smartphone", price: 899, image: "/smartphone.jpg", category: "Electronics", brand: "Samsung", seller: "Amazon", rating: 4.4, stock: 70 },
            { id: 34, title: "Mechanical Keyboard", price: 129, image: "/keyboard.jpg", category: "Electronics", brand: "Logitech", seller: "Amazon", rating: 4.3, stock: 0 },
            { id: 35, title: "Smartwatch", price: 249, image: "/smartwatch.jpg", category: "Electronics", brand: "Apple", seller: "Best Buy", rating: 4.6, stock: 30 },
            { id: 36, title: "4K Monitor", price: 499, image: "/monitor.jpg", category: "Electronics", brand: "LG", seller: "Newegg", rating: 4.7, stock: 50 },
            { id: 37, title: "Bluetooth Speaker", price: 99, image: "/speaker.jpg", category: "Electronics", brand: "Bose", seller: "Amazon", rating: 4.8, stock: 110 },
            { id: 38, title: "Fitness Tracker", price: 199, image: "/fitness-tracker.jpg", category: "Electronics", brand: "Fitbit", seller: "Amazon", rating: 4.5, stock: 65 },
            { id: 39, title: "VR Headset", price: 349, image: "/vr-headset.jpg", category: "Electronics", brand: "Meta", seller: "Best Buy", rating: 4.6, stock: 0 },
            { id: 40, title: "Gaming Mouse", price: 89, image: "/gaming-mouse.jpg", category: "Electronics", brand: "Razer", seller: "eBay", rating: 4.7, stock: 80 },
            { id: 41, title: "Graphic Tablet", price: 299, image: "/graphic-tablet.jpg", category: "Electronics", brand: "Wacom", seller: "Amazon", rating: 4.5, stock: 45 },
            { id: 42, title: "Portable SSD", price: 179, image: "/portable-ssd.jpg", category: "Electronics", brand: "Samsung", seller: "Newegg", rating: 4.7, stock: 120 },
            { id: 43, title: "Drone", price: 899, image: "/drone.jpg", category: "Electronics", brand: "DJI", seller: "Amazon", rating: 4.8, stock: 15 },
            { id: 44, title: "E-Reader", price: 139, image: "/ereader.jpg", category: "Electronics", brand: "Kindle", seller: "Amazon", rating: 4.6, stock: 60 },
            { id: 45, title: "Electric Scooter", price: 599, image: "/electric-scooter.jpg", category: "Electronics", brand: "Segway", seller: "eBay", rating: 4.4, stock: 40 },
            { id: 46, title: "Air Purifier", price: 249, image: "/air-purifier.jpg", category: "Home Appliances", brand: "Dyson", seller: "Amazon", rating: 4.7, stock: 85 },
            { id: 47, title: "Cordless Vacuum Cleaner", price: 499, image: "/vacuum.jpg", category: "Home Appliances", brand: "Dyson", seller: "Best Buy", rating: 4.5, stock: 0 },
            { id: 48, title: "Instant Pot", price: 129, image: "/instant-pot.jpg", category: "Home Appliances", brand: "Instant Pot", seller: "Amazon", rating: 4.6, stock: 55 },
            { id: 49, title: "Espresso Machine", price: 349, image: "/espresso.jpg", category: "Home Appliances", brand: "Breville", seller: "Amazon", rating: 4.8, stock: 30 },
            { id: 50, title: "Stand Mixer", price: 449, image: "/mixer.jpg", category: "Home Appliances", brand: "KitchenAid", seller: "Best Buy", rating: 4.9, stock: 20 },
            { id: 51, title: "Refrigerator", price: 1399, image: "/refrigerator.jpg", category: "Home Appliances", brand: "Samsung", seller: "Best Buy", rating: 4.7, stock: 90 },
            { id: 52, title: "Washing Machine", price: 999, image: "/washing-machine.jpg", category: "Home Appliances", brand: "LG", seller: "Newegg", rating: 4.6, stock: 120 },
            { id: 53, title: "Electric Kettle", price: 59, image: "/kettle.jpg", category: "Home Appliances", brand: "Philips", seller: "Amazon", rating: 4.4, stock: 200 },
            { id: 54, title: "Air Fryer", price: 149, image: "/air-fryer.jpg", category: "Home Appliances", brand: "Ninja", seller: "Amazon", rating: 4.5, stock: 0 },
            { id: 55, title: "Winter Jacket", price: 199, image: "/jacket.jpg", category: "Clothing", brand: "The North Face", seller: "Amazon", rating: 4.3, stock: 85 },
            { id: 56, title: "Running Shoes", price: 139, image: "/running-shoes.jpg", category: "Clothing", brand: "Adidas", seller: "eBay", rating: 4.2, stock: 100 },
            { id: 57, title: "Designer Sunglasses", price: 199, image: "/sunglasses.jpg", category: "Clothing", brand: "Ray-Ban", seller: "Best Buy", rating: 4.6, stock: 30 },
            { id: 58, title: "Leather Wallet", price: 89, image: "/wallet.jpg", category: "Clothing", brand: "Fossil", seller: "Amazon", rating: 4.5, stock: 60 },
            { id: 59, title: "Backpack", price: 129, image: "/backpack.jpg", category: "Clothing", brand: "Herschel", seller: "Amazon", rating: 4.4, stock: 80 },
            { id: 60, title: "Luxury Watch", price: 4999, image: "/watch.jpg", category: "Clothing", brand: "Rolex", seller: "Amazon", rating: 4.9, stock: 10 },
            { id: 61, title: "Gaming Console", price: 499, image: "/console.jpg", category: "Electronics", brand: "Sony", seller: "Best Buy", rating: 4.8, stock: 40 },
            { id: 62, title: "Board Game", price: 49, image: "/board-game.jpg", category: "Toys", brand: "Hasbro", seller: "Amazon", rating: 4.3, stock: 100 },
            { id: 63, title: "LEGO Set", price: 199, image: "/lego.jpg", category: "Toys", brand: "LEGO", seller: "Amazon", rating: 4.7, stock: 55 },
            { id: 64, title: "Action Figure", price: 39, image: "/action-figure.jpg", category: "Toys", brand: "Marvel", seller: "eBay", rating: 4.5, stock: 0 },
            { id: 65, title: "Toy Car", price: 29, image: "/toy-car.jpg", category: "Toys", brand: "Hot Wheels", seller: "Best Buy", rating: 4.2, stock: 200 },
            { id: 66, title: "Electric Guitar", price: 999, image: "/guitar.jpg", category: "Music", brand: "Fender", seller: "Amazon", rating: 4.8, stock: 0 },
            { id: 67, title: "Synthesizer", price: 1199, image: "/synthesizer.jpg", category: "Music", brand: "Moog", seller: "Amazon", rating: 4.7, stock: 30 },
            { id: 68, title: "Bluetooth Earbuds", price: 149, image: "/earbuds.jpg", category: "Electronics", brand: "Samsung", seller: "eBay", rating: 4.4, stock: 50 },
            { id: 69, title: "Smart Thermostat", price: 229, image: "/thermostat.jpg", category: "Home Appliances", brand: "Nest", seller: "Amazon", rating: 4.5, stock: 85 },
            { id: 70, title: "Massage Chair", price: 2499, image: "/massage-chair.jpg", category: "Home Appliances", brand: "Osaki", seller: "Amazon", rating: 4.9, stock: 0 },
            { id: 71, title: "Outdoor Grill", price: 799, image: "/grill.jpg", category: "Home Appliances", brand: "Weber", seller: "Best Buy", rating: 4.7, stock: 60 },
            { id: 72, title: "Camping Tent", price: 299, image: "/tent.jpg", category: "Outdoors", brand: "Coleman", seller: "Amazon", rating: 4.6, stock: 40 },
            { id: 73, title: "Hiking Boots", price: 199, image: "/hiking-boots.jpg", category: "Outdoors", brand: "Salomon", seller: "Amazon", rating: 4.5, stock: 90 },
            { id: 74, title: "Fishing Rod", price: 159, image: "/fishing-rod.jpg", category: "Outdoors", brand: "Shimano", seller: "eBay", rating: 4.4, stock: 70 },
            { id: 75, title: "Yoga Mat", price: 49, image: "/yoga-mat.jpg", category: "Sports", brand: "Liforme", seller: "Amazon", rating: 4.3, stock: 150 }
        ]
};
'''

# Use regular expression to replace all image URLs
updated_str = re.sub(r'image: "[^"]*"', 'image: "/iphone.jpg"', mock_products_str)

# Output the updated string
print(updated_str)
