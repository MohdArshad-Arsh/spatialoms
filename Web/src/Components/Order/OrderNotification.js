import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  BellOff
} from "lucide-react";
import axios from "axios";
import { properties } from '../../Properties/Properties';

const OrderNotification = () => {
  const [orderTypes, setOrderTypes] = useState({});
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem("jwtToken");

  useEffect(() => {
    fetchCreatedOrders();
  }, []);

  const fetchCreatedOrders = async () => {
    try {
      const res = await axios.get(
        properties.Port + properties.getAllCreatedOrders, {
        headers: { Authorization: `Bearer ${token}` },
      }
      );

      // Sort by ID descending (latest first)
      const sortedOrders = res.data.sort((a, b) => b.id - a.id);
      setOrders(sortedOrders);

      // Initialize orderTypes from fetched data (use existing orderType if present)
      const types = {};
      res.data.forEach(order => {
        // ✅ Always pre-fill from backend value (or empty string if not set)
        types[order.id] = order.orderType || "";
      });
      setOrderTypes(types);

    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- ACTION HANDLERS ---------------- */

  const approveOrder = async (orderId) => {
    try {
      const type = orderTypes[orderId];

      if (!type) {
        alert("Please select an Order Type before approving.");
        return;
      }

      await axios.put(
        `${properties.Port}${properties.approveOrder}${orderId}/APPROVED`,
        {},
        {
          params: { orderType: type },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      alert("Failed to approve order");
    }
  };

  const rejectOrder = async (orderId) => {
    try {
      const type = orderTypes[orderId];

      await axios.put(
        `${properties.Port}${properties.approveOrder}${orderId}/REJECTED`,
        {},
        {
          params: { orderType: type },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      alert("Failed to reject order");
    }
  };

  /* ---------------- FILTER ---------------- */

  const filteredOrders = orders.filter(o =>
    o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.poId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <p className="text-center text-gray-500">Loading orders…</p>;
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="text-blue-600" />
            Order Approvals
          </h2>
          <p className="text-gray-500">
            Review and approve newly created orders
          </p>
        </div>

        {filteredOrders.length > 0 && (
          <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">
            {filteredOrders.length} Pending
          </div>
        )}
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow mb-4 relative">
        <Search className="absolute left-6 top-6 text-gray-400" />
        <input
          type="text"
          placeholder="Search by client or PO ID..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-2 border rounded-lg"
        />
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl shadow divide-y">

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <BellOff className="mx-auto text-gray-300 w-16 h-16" />
            <p className="text-gray-500 mt-2">No pending orders</p>
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <div
              key={order.id}
              className={`p-6 hover:bg-gray-50 transition-all ${index === 0 ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
            >
              <div className="flex gap-4">

                {/* ICON */}
                <div className={`p-3 rounded-lg ${index === 0 ? 'bg-blue-100' : 'bg-yellow-50'}`}>
                  <AlertCircle className={index === 0 ? 'text-blue-600' : 'text-yellow-600'} />
                </div>

                {/* CONTENT */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        Order Approval Required
                        {index === 0 && (
                          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                            NEW
                          </span>
                        )}
                      </h3>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full font-semibold ${order.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      order.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {order.priority}
                    </span>
                  </div>

                  <p className="text-gray-700 mt-1">
                    <b>{order.clientName}</b> ({order.poId}) is waiting for approval
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm text-gray-600">
                    <div className="bg-blue-50 p-2 rounded">
                      <b className="text-blue-700">Total Area:</b>
                      <span className="ml-1 font-semibold">{order.totalArea} km²</span>
                    </div>
                    <div className="bg-orange-50 p-2 rounded">
                      <b className="text-orange-700">Remaining:</b>
                      <span className="ml-1 font-semibold">{order.remainingArea} km²</span>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <b className="text-green-700">Vendor:</b>
                      <span className="ml-1 font-semibold">{order.vendorNo || "Not Assigned"}</span>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <b className="text-purple-700">Sensors:</b>
                      <span className="ml-1 font-semibold">
                        {order.sansor?.length ? order.sansor.join(", ") : "N/A"}
                      </span>
                    </div>

                    {/* ✅ ORDER TYPE - Always visible & always editable */}
                    <div className="bg-indigo-50 p-2 rounded col-span-2 md:col-span-1 flex flex-col gap-1">
                      <b className="text-indigo-700">Order Type:</b>
                      <select
                        value={orderTypes[order.id] || ""}
                        onChange={(e) =>
                          setOrderTypes(prev => ({
                            ...prev,
                            [order.id]: e.target.value
                          }))
                        }
                        className="border border-indigo-300 rounded px-2 py-1 text-sm bg-white text-indigo-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        <option value="">-- Select Type --</option>
                        <option value="Tasking">Tasking</option>
                        <option value="Archiving">Archiving</option>
                        <option value="Tasking/Archive">Tasking/Archive</option>
                      </select>
                      {/* ✅ Show a small badge if already set from OrderCreate */}
                      {order.orderType && (
                        <span className="text-[10px] text-indigo-500 italic">
                          Pre-filled from order creation
                        </span>
                      )}
                    </div>

                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <span className="inline-block px-3 py-1 text-xs bg-gray-100 rounded-full">
                      Order ID: {order.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      Created: {new Date(order.createdDate).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => approveOrder(order.id)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>

                  <button
                    onClick={() => rejectOrder(order.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                  >
                    <X size={16} />
                    Reject
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderNotification;