from rest_framework import serializers
from .models import (
    Product,  Category,  
     Order, OrderItem,
    Rating, Comment, SensitiveData, RefundRequest, UserProfile
)
from django.contrib.auth.models import User
from decimal import Decimal
from .utils import (
    validate_email, validate_username, validate_password,
    validate_text_input, validate_numeric_input, validate_id
)
from django.core.exceptions import ValidationError



class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']
    
    def validate_name(self, value):
        try:
            return validate_text_input(value, field_name="Category name", min_length=2, max_length=100)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'role']
        read_only_fields = ['id', 'is_staff', 'role']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[('customer', 'Customer'), ('sales_manager', 'Sales Manager'), ('product_manager', 'Product Manager')], default='customer', required=False)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name', 'role']
    
    def validate_username(self, value):
        try:
            return validate_username(value)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_email(self, value):
        try:
            return validate_email(value)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_password(self, value):
        try:
            return validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_first_name(self, value):
        try:
            return validate_text_input(value, field_name="First name", min_length=1, max_length=30)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_last_name(self, value):
        try:
            return validate_text_input(value, field_name="Last name", min_length=1, max_length=30)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate(self, data):
        # Check if passwords match
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError("Passwords do not match")
        
        # Check if email already exists
        email = data.get('email')
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError("Email already exists")
        
        # Check if username already exists
        username = data.get('username')
        if username and User.objects.filter(username=username).exists():
            raise serializers.ValidationError("Username already exists")
        
        return data
    
    def create(self, validated_data):
        role = validated_data.pop('role', 'customer')
        validated_data.pop('confirm_password', None)
        user = User.objects.create_user(**validated_data)
        # Ensure the profile exists before accessing it
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name']
    
    def validate_username(self, value):
        try:
            return validate_username(value)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_email(self, value):
        try:
            return validate_email(value)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_first_name(self, value):
        try:
            return validate_text_input(value, field_name="First name", min_length=1, max_length=30)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_last_name(self, value):
        try:
            return validate_text_input(value, field_name="Last name", min_length=1, max_length=30)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def update(self, instance, validated_data):
        # Update user fields
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    stock = serializers.IntegerField(source='quantity_in_stock', read_only=True)
    rating = serializers.FloatField(source='avg_rating', read_only=True)
    total_ratings = serializers.SerializerMethodField(read_only=True)
    image_url = serializers.SerializerMethodField(read_only=True)
    
    def get_total_ratings(self, obj):
        return Rating.objects.filter(product=obj).count()
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    cost = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False,
        allow_null=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'model', 'serial_number', 'description',
            'quantity_in_stock', 'stock', 'price', 'cost', 'warranty_status',
            'distributor_info', 'category', 'category_id',
            'is_available', 'rating', 'total_ratings', 'image', 'image_url'
        ]
    
    def validate_title(self, value):
        try:
            return validate_text_input(value, field_name="Title", min_length=3, max_length=255)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_model(self, value):
        try:
            return validate_text_input(value, field_name="Model", min_length=1, max_length=255)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_serial_number(self, value):
        try:
            return validate_text_input(value, field_name="Serial number", min_length=1, max_length=255)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_description(self, value):
        try:
            return validate_text_input(value, field_name="Description", min_length=10, max_length=5000)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_quantity_in_stock(self, value):
        try:
            return validate_numeric_input(value, field_name="Quantity in stock", min_value=0)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_price(self, value):
        try:
            return validate_numeric_input(value, field_name="Price", min_value=0.01)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_cost(self, value):
        if value is not None:
            try:
                return validate_numeric_input(value, field_name="Cost", min_value=0.01)
            except ValidationError as e:
                raise serializers.ValidationError(str(e))
        return value
    
    def validate_distributor_info(self, value):
        try:
            return validate_text_input(value, field_name="Distributor info", min_length=5, max_length=1000)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def create(self, validated_data):
        # Calculate cost field if price is provided and cost is not
        if 'price' in validated_data and ('cost' not in validated_data or validated_data['cost'] is None):
            validated_data['cost'] = validated_data['price'] * Decimal('0.5')
        
        # Create the product
        product = Product.objects.create(**validated_data)
        return product



class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_id', 'quantity', 'price_at_purchase']
    
    def validate_quantity(self, value):
        try:
            return validate_numeric_input(value, field_name="Quantity", min_value=1, max_value=100)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_price_at_purchase(self, value):
        try:
            return validate_numeric_input(value, field_name="Price", min_value=0.01)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_product_id(self, value):
        # Check if product exists and is available
        if not value.is_available:
            raise serializers.ValidationError("Product is not available")
        return value


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    order_items = OrderItemSerializer(many=True, write_only=True)
    status = serializers.CharField(read_only=True)
    invoice_pdf = serializers.FileField(read_only=True)
    delivery_address = serializers.CharField(write_only=True)

    class Meta:
        model = Order
        fields = ['id', 'created_at', 'status', 'total_price', 'items', 'order_items', 'delivery_address', 'invoice_pdf']
    
    def validate_total_price(self, value):
        try:
            return validate_numeric_input(value, field_name="Total price", min_value=0.01)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate_delivery_address(self, value):
        try:
            return validate_text_input(value, field_name="Delivery address", min_length=10, max_length=500)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate(self, data):
        # Check if order_items is provided
        if 'order_items' not in data or not data['order_items']:
            raise serializers.ValidationError("Order must contain at least one item")
        
        # Calculate total price from items and compare with provided total_price
        calculated_total = sum(item['quantity'] * item['price_at_purchase'] for item in data['order_items'])
        provided_total = data.get('total_price', 0)
        
        # Allow for small rounding differences (up to 1 cent)
        if abs(calculated_total - provided_total) > 0.01:
            raise serializers.ValidationError("Total price does not match the sum of item prices")
        
        return data


class RatingSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    product_details = ProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = Rating
        fields = ['id', 'product', 'user', 'score', 'created_at', 'user_details', 'product_details']
        read_only_fields = ['created_at', 'user_details', 'product_details']
        extra_kwargs = {
            'user': {'write_only': True},
            'product': {'write_only': True}
        }
    
    def validate_score(self, value):
        try:
            return validate_numeric_input(value, field_name="Score", min_value=1, max_value=5)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
    
    def validate(self, data):
        # Check if user has already rated this product
        user = data.get('user')
        product = data.get('product')
        if user and product and Rating.objects.filter(user=user, product=product).exists():
            # Get the existing rating
            existing_rating = Rating.objects.get(user=user, product=product)
            if self.instance and self.instance.id == existing_rating.id:
                # This is an update to the existing rating, which is allowed
                pass
            else:
                # This is a new rating, but the user has already rated this product
                raise serializers.ValidationError("You have already rated this product")
        return data


class CommentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    product_details = ProductSerializer(source='product', read_only=True)
    approved = serializers.BooleanField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'product', 'user', 'text', 'approved', 'created_at', 'user_details', 'product_details']
        read_only_fields = ['approved', 'created_at', 'user_details', 'product_details']
        extra_kwargs = {
            'user': {'write_only': True},
            'product': {'write_only': True}
        }
    
    def validate_text(self, value):
        try:
            return validate_text_input(value, field_name="Comment text", min_length=3, max_length=1000)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))


class SensitiveDataSerializer(serializers.ModelSerializer):
    """
    Serializer for sensitive user data with special handling for encrypted fields.
    """
    # Use these fields for reading (they will be decrypted)
    credit_card_number = serializers.SerializerMethodField()
    tax_id = serializers.SerializerMethodField()
    home_address = serializers.SerializerMethodField()
    phone_number = serializers.SerializerMethodField()
    date_of_birth = serializers.SerializerMethodField()
    
    # Use these fields for writing (they will be encrypted during save)
    credit_card_number_write = serializers.CharField(write_only=True, required=False, allow_blank=True)
    tax_id_write = serializers.CharField(write_only=True, required=False, allow_blank=True)
    home_address_write = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone_number_write = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date_of_birth_write = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = SensitiveData
        fields = [
            'id', 'user', 
            'credit_card_number', 'tax_id', 'home_address', 'phone_number', 'date_of_birth',
            'credit_card_number_write', 'tax_id_write', 'home_address_write', 'phone_number_write', 'date_of_birth_write'
        ]
        read_only_fields = ['id', 'user']
    
    def get_credit_card_number(self, obj):
        """Get decrypted credit card number."""
        value = obj.get_credit_card_number()
        # Mask all but last 4 digits for extra security
        if value and len(value) > 4:
            return '*' * (len(value) - 4) + value[-4:]
        return value
    
    def get_tax_id(self, obj):
        """Get decrypted tax ID."""
        value = obj.get_tax_id()
        # Mask all but last 4 digits for extra security
        if value and len(value) > 4:
            return '*' * (len(value) - 4) + value[-4:]
        return value
    
    def get_home_address(self, obj):
        """Get decrypted home address."""
        return obj.get_home_address()
    
    def get_phone_number(self, obj):
        """Get decrypted phone number."""
        return obj.get_phone_number()
    
    def get_date_of_birth(self, obj):
        """Get decrypted date of birth."""
        return obj.get_date_of_birth()
    
    def validate_credit_card_number_write(self, value):
        """Validate credit card number format."""
        if value:
            # Remove spaces and dashes
            value = value.replace(' ', '').replace('-', '')
            
            # Check if it's numeric and of valid length (13-19 digits)
            if not value.isdigit() or not (13 <= len(value) <= 19):
                raise serializers.ValidationError("Invalid credit card number format")
            
            # Luhn algorithm check (basic credit card validation)
            digits = [int(d) for d in value]
            checksum = 0
            for i, digit in enumerate(reversed(digits)):
                if i % 2 == 1:  # Odd positions (from right)
                    digit *= 2
                    if digit > 9:
                        digit -= 9
                checksum += digit
            
            if checksum % 10 != 0:
                raise serializers.ValidationError("Invalid credit card number checksum")
        
        return value
    
    def validate_phone_number_write(self, value):
        """Validate phone number format."""
        if value:
            # Remove common separators
            value = value.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
            
            # Check if it's a valid phone number (simple check)
            if not (value.startswith('+') and value[1:].isdigit()) and not value.isdigit():
                raise serializers.ValidationError("Invalid phone number format")
        
        return value
    
    def update(self, instance, validated_data):
        """Update the SensitiveData instance with validated data."""
        # Update fields with the write-only values
        if 'credit_card_number_write' in validated_data:
            instance.credit_card_number = validated_data.pop('credit_card_number_write')
        
        if 'tax_id_write' in validated_data:
            instance.tax_id = validated_data.pop('tax_id_write')
        
        if 'home_address_write' in validated_data:
            instance.home_address = validated_data.pop('home_address_write')
        
        if 'phone_number_write' in validated_data:
            instance.phone_number = validated_data.pop('phone_number_write')
        
        if 'date_of_birth_write' in validated_data:
            instance.date_of_birth = validated_data.pop('date_of_birth_write')
        
        # Save the instance (encryption happens in the model's save method)
        instance.save()
        return instance


class RefundRequestSerializer(serializers.ModelSerializer):
    order_item_info = OrderItemSerializer(source='order_item', read_only=True)
    user_info = UserSerializer(source='user', read_only=True)
    approved_by_info = UserSerializer(source='approved_by', read_only=True)

    class Meta:
        model = RefundRequest
        fields = [
            'id', 'order_item', 'order_item_info', 'user', 'user_info',
            'status', 'request_date', 'decision_date', 'approved_by', 'approved_by_info',
            'refund_amount', 'reason'
        ]
        read_only_fields = ['id', 'status', 'request_date', 'decision_date', 'approved_by', 'refund_amount']

    def validate(self, data):
        # Ensure order item belongs to user and is delivered, and within 30 days
        order_item = data.get('order_item')
        user = data.get('user')
        if order_item is None or user is None:
            raise serializers.ValidationError('Order item and user are required.')
        order = order_item.order
        if order.user != user:
            raise serializers.ValidationError('You can only request a refund for your own orders.')
        if order.status != 'delivered':
            raise serializers.ValidationError('Refunds can only be requested for delivered orders.')
        from django.utils import timezone
        if (timezone.now() - order.created_at).days > 30:
            raise serializers.ValidationError('Refund requests must be made within 30 days of delivery.')
        return data
