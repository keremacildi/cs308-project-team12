// app/products/[productId]/page.js
import AddToCartButton from '../../../components/ui/AddToCartButton';
import Image from 'next/image';


export default function ProductDetail({ params }) {
  const { productId } = params;

  if (!product) {
    return <div>Product not found.</div>;
  }

  return (
    <div style={styles.container}>
      <h1>{product.title}</h1>
      {/* Update image path to point to the new static folder */}
      <Image src={`/images/products/${product.image}`} alt={product.title} style={styles.image} />
      <p style={styles.detail}><strong>Price:</strong> ${product.price}</p>
      <p style={styles.detail}><strong>Category:</strong> {product.category}</p>
      <p style={styles.detail}><strong>Brand:</strong> {product.brand}</p>
      <p style={styles.detail}><strong>Seller:</strong> {product.seller}</p>
      <p style={styles.detail}><strong>Rating:</strong> {product.rating}</p>
      
      {/* Add to Cart button */}
      <div className="mt-8">
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
