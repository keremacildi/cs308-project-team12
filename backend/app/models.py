from django.db import models

class Customer(models.Model):
    # Django automatically creates an AutoField named 'id' as primary key.
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    home_address = models.TextField(blank=True, null=True)
    password = models.CharField(max_length=128)

    def __str__(self):
        return self.name        

class Product(models.Model):
    # Django will create an 'id' primary key automatically unless you override it.
    name = models.CharField(max_length=100)
    model = models.CharField(max_length=100, blank=True, null=True)
    serial_number = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    quantity_in_stock = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    warranty_status = models.CharField(max_length=50, blank=True, null=True) #Under warranty True or Not 
    distributor_information = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.model}"