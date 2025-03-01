from django.db import models

class product(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField()

    def __str__(self):
        return self.name

class Customer(models.Model):
    # Django automatically creates an AutoField named 'id' as primary key.
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    home_address = models.TextField(blank=True, null=True)
    password = models.CharField(max_length=128)

    def __str__(self):
        return self.name        