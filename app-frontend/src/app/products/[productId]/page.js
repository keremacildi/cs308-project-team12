// app/products/[productId]/page.js
import { mockProducts } from '../../data/mock_data/products';
import AddToCartButton from '../../../components/ui/AddToCartButton';

export async function generateStaticParams() {
  return mockProducts.product.map((prod) => ({
    productId: prod.id.toString(),
  }));
}

export default function ProductDetail({ params }) {
  const { productId } = params;
  const product = mockProducts.product.find((p) => p.id.toString() === productId);

  if (!product) {
    return <div>Product not found.</div>;
  }

  return (
    <div style={styles.container}>
      <h1>{product.title}</h1>
      {/* Update image path to point to the new static folder */}
      <img src={`/images/products/${product.image}`} alt={product.title} style={styles.image} />
      <p style={styles.detail}><strong>Price:</strong> ${product.price}</p>
      <p style={styles.detail}><strong>Category:</strong> {product.category}</p>
      <p style={styles.detail}><strong>Brand:</strong> {product.brand}</p>
      <p style={styles.detail}><strong>Seller:</strong> {product.seller}</p>
      <p style={styles.detail}><strong>Rating:</strong> {product.rating}</p>
      
      {/* Add to Cart button */}
      <AddToCartButton product={product} />
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '40px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
  },
  image: {
    width: '100%',
    height: 'auto',
    marginBottom: '20px',
  },
  detail: {
    fontSize: '16px',
    margin: '8px 0',
  },
};
