from django.contrib import admin
from .models import (
     Category, Product,  Order,
    OrderItem, Rating, Comment,  
    UserProfile
        )

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    search_fields = ('user__username', 'role')

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Rating)
admin.site.register(Comment)
