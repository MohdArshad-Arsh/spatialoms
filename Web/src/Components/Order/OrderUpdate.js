import React, { useState, useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import {
    ArrowLeft, Save, X, Package, MapPin,
    AlertCircle, CheckCircle, Clock, Edit, Loader, Plus, Trash2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { properties } from '../../Properties/Properties';

const STATUSES = ['IN_PROGRESS', 'PARTIALLY_COMPLETED', 'COMPLETED', 'COMPLETED_WITH_ENHANCEMENTS', 'PRODUCTION_FAIL'];

// Sensor Price Mappings
const SENSOR_PRICE_TASKING = {
    'Sensor 1': 21, 'Sensor 2': 22, 'Sensor 3': 23, 'Sensor 4': 24, 'Sensor 5': 25,
    'Sensor 6': 26, 'Sensor 7': 27, 'Sensor 8': 28, 'Sensor 9': 29, 'Sensor 10': 30,
    'Sensor 11': 31, 'Sensor 12': 32, 'Sensor 13': 33, 'Sensor 14': 34, 'Sensor 15': 35,
    'Sensor 16': 36, 'Sensor 17': 37, 'Sensor 18': 38, 'Sensor 19': 39, 'Sensor 20': 40
};

const SENSOR_PRICE_ARCHIVE = {
    'Sensor 1': 1, 'Sensor 2': 2, 'Sensor 3': 3, 'Sensor 4': 4, 'Sensor 5': 5,
    'Sensor 6': 6, 'Sensor 7': 7, 'Sensor 8': 8, 'Sensor 9': 9, 'Sensor 10': 10,
    'Sensor 11': 11, 'Sensor 12': 12, 'Sensor 13': 13, 'Sensor 14': 14, 'Sensor 15': 15,
    'Sensor 16': 16, 'Sensor 17': 17, 'Sensor 18': 18, 'Sensor 19': 19, 'Sensor 20': 20
};

const OrderUpdate = ({ history, location }) => {

    const orderData = location.state?.orderData;
    const returnTo = location.state?.returnTo || 'orders';

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Sensor state
    const [sensors, setSensors] = useState([]);
    const [selectedSensor, setSelectedSensor] = useState('');
    const [newSensorName, setNewSensorName] = useState('');
    const [showAddSensor, setShowAddSensor] = useState(false);
    const [addSensorError, setAddSensorError] = useState('');

    // Price state
    const [pricePerKm, setPricePerKm] = useState(0);
    const [defaultPricePerKm, setDefaultPricePerKm] = useState(0);

    // Tasking/Archive state
    const [selectedTaskingType, setSelectedTaskingType] = useState('');
    const [isTaskingArchive, setIsTaskingArchive] = useState(false);
    const [isTaskingOrder, setIsTaskingOrder] = useState(false);

    const [formData, setFormData] = useState({
        id: '',
        orderId: '',
        poId: '',
        client: '',
        totalArea: 0,
        collectedArea: 0,
        remainingArea: 0,
        areaCovered: 0,
        percentageComplete: 0,
        status: '',
        comment: '',
        orderType: ''
    });

    useEffect(() => {
        if (!orderData) {
            if (returnTo === 'dashboard') {
                history.push('/dashboard');
            } else {
                history.push('/orders');
            }
            return;
        }

        const totalArea = orderData.area?.total || 0;
        const orderPrice = orderData.price || 0;
        const calculatedPricePerKm = totalArea > 0 ? (orderPrice / totalArea) : 0;

        const orderType = orderData.orderType || '';
        const isTaskingArchiveType = orderType === 'Tasking/Archive';
        const isTaskingType = orderType === 'Tasking';

        setFormData({
            id: orderData.id || '',
            orderId: orderData.orderId || '',
            poId: orderData.poId || '',
            client: orderData.client || '',
            totalArea: totalArea,
            collectedArea: orderData.area?.collected || 0,
            remainingArea: orderData.area?.unfulfilled || 0,
            areaCovered: 0,
            percentageComplete: orderData.progress || 0,
            status: orderData.status || '',
            comment: '',
            orderType: orderType
        });

        setSensors(orderData.sensorList || []);
        setDefaultPricePerKm(calculatedPricePerKm);
        setPricePerKm(calculatedPricePerKm);
        setIsTaskingArchive(isTaskingArchiveType);
        setIsTaskingOrder(isTaskingType);
        // Auto-select Tasking for pure Tasking orders
        if (isTaskingType) {
            setSelectedTaskingType('Tasking');
        }
    }, [orderData, history, returnTo]);

    // ── ADD SENSOR ─────────────────────────────────────────────────────────────
    const handleAddSensor = () => {
        const trimmed = newSensorName.trim();

        if (!trimmed) {
            setAddSensorError('Sensor name cannot be empty.');
            return;
        }

        const duplicate = sensors.some(
            (s) => s.toLowerCase() === trimmed.toLowerCase()
        );
        if (duplicate) {
            setAddSensorError(`"${trimmed}" already exists in the list.`);
            return;
        }

        setSensors((prev) => [...prev, trimmed]);
        setSelectedSensor(trimmed);   // auto-select the newly added sensor
        setNewSensorName('');
        setShowAddSensor(false);
        setAddSensorError('');
    };

    // ── REMOVE SENSOR ──────────────────────────────────────────────────────────
    const handleRemoveSensor = (sensor) => {
        setSensors((prev) => prev.filter((s) => s !== sensor));
        if (selectedSensor === sensor) setSelectedSensor('');
    };

    // ── GET PRICE BY SENSOR AND TYPE ────────────────────────────────────────────
    const getPriceForSensor = (sensor, type) => {
        if (!sensor || !type) return 0;
        const priceMap = type === 'Tasking' ? SENSOR_PRICE_TASKING : SENSOR_PRICE_ARCHIVE;
        return priceMap[sensor] || 0;
    };

    // ── UPDATE PRICE WHEN SENSOR OR TYPE CHANGES ────────────────────────────────
    useEffect(() => {
        if (selectedSensor) {
            if (isTaskingOrder) {
                // For pure Tasking orders: always use Tasking pricing
                const newPrice = SENSOR_PRICE_TASKING[selectedSensor] || 0;
                setPricePerKm(newPrice);
            } else if (isTaskingArchive && selectedTaskingType) {
                // For Tasking/Archive orders: use selected type's price
                const newPrice = getPriceForSensor(selectedSensor, selectedTaskingType);
                setPricePerKm(newPrice);
            } else if (!isTaskingArchive) {
                // For regular orders: use Archive pricing by default
                const newPrice = SENSOR_PRICE_ARCHIVE[selectedSensor] || 0;
                setPricePerKm(newPrice);
            }
        }
    }, [selectedSensor, selectedTaskingType, isTaskingArchive, isTaskingOrder]);

    // ── HANDLE PRODUCTION FAIL STATUS ──────────────────────────────────────────
    useEffect(() => {
        if (formData.status === 'PRODUCTION_FAIL') {
            setFormData(prev => ({
                ...prev,
                areaCovered: 0
            }));
            setPricePerKm(0);
        }
    }, [formData.status]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedSensor && formData.status !== 'PRODUCTION_FAIL') {
            Swal.fire({
                icon: 'warning',
                title: '<strong style="color: #f59e0b; font-size: 26px;">⚠️ Sensor Required</strong>',
                html: `
                    <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 20px; border-radius: 12px; color: white; margin: 15px 0;">
                        <div style="background: rgba(255,255,255,0.95); padding: 18px; border-radius: 10px; color: #1f2937;">
                            <div style="background: #fef3c7; padding: 15px; border-radius: 10px; border-left: 4px solid #f59e0b;">
                                <p style="color: #92400e; font-weight: 600; margin: 0; font-size: 15px;">
                                    📋 Please select a sensor before updating the order
                                </p>
                            </div>
                        </div>
                    </div>
                `,
                confirmButtonColor: '#f59e0b',
                confirmButtonText: 'OK',
                width: '500px'
            });
            return;
        }

        if (isTaskingArchive && !selectedTaskingType && formData.status !== 'PRODUCTION_FAIL') {
            Swal.fire({
                icon: 'warning',
                title: '<strong style="color: #f59e0b; font-size: 26px;">⚠️ Type Required</strong>',
                html: `
                    <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 20px; border-radius: 12px; color: white; margin: 15px 0;">
                        <div style="background: rgba(255,255,255,0.95); padding: 18px; border-radius: 10px; color: #1f2937;">
                            <div style="background: #fef3c7; padding: 15px; border-radius: 10px; border-left: 4px solid #f59e0b;">
                                <p style="color: #92400e; font-weight: 600; margin: 0; font-size: 15px;">
                                    📋 Please select Archive or Tasking before updating the order
                                </p>
                            </div>
                        </div>
                    </div>
                `,
                confirmButtonColor: '#f59e0b',
                confirmButtonText: 'OK',
                width: '500px'
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = sessionStorage.getItem('jwtToken');

            let url = `${properties.Port}order/updateStatus/${formData.id}/${formData.status}/${formData.areaCovered}?area=${formData.areaCovered}&comment=${encodeURIComponent(formData.comment)}&selectedSensor=${encodeURIComponent(selectedSensor)}&pricePerKm=${pricePerKm}`;
            if (isTaskingArchive && selectedTaskingType) {
                url += `&taskingType=${encodeURIComponent(selectedTaskingType)}`;
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const respText = await response.text();
            if (!response.ok) {
                let serverMsg = respText || `Server responded with status ${response.status}`;
                try {
                    const json = JSON.parse(respText);
                    serverMsg = json?.message || json?.error || JSON.stringify(json);
                } catch (_) {}
                throw new Error(serverMsg);
            }

            const areaCovered = formData.status === 'PRODUCTION_FAIL' ? 0 : parseFloat(formData.areaCovered);
            const newCollectedArea = formData.collectedArea + areaCovered;
            const newRemainingArea = formData.remainingArea - areaCovered;
            const newPercentage = Math.round((newCollectedArea / formData.totalArea) * 100);
            const extraArea = newCollectedArea > formData.totalArea ? (newCollectedArea - formData.totalArea) : 0;

            setFormData(prev => ({
                ...prev,
                collectedArea: newCollectedArea,
                remainingArea: newRemainingArea,
                percentageComplete: newPercentage,
                areaCovered: 0,
                comment: ''
            }));

            setSelectedSensor('');

            const statusConfig = {
                'IN_PROGRESS': {
                    icon: 'info',
                    title: '<strong style="color: #1e40af; font-size: 28px;">📍 Order In Progress</strong>',
                    html: `
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 15px; color: white; margin: 20px 0;">
                            <div style="background: rgba(255,255,255,0.95); padding: 20px; border-radius: 12px; color: #1f2937;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
                                    <div><p style="color: #6b7280; font-size: 12px; margin: 0;">ORDER ID</p><p style="font-weight: bold; font-size: 18px; color: #1e40af; margin: 5px 0;">${formData.orderId}</p></div>
                                    <div style="text-align: right;"><p style="color: #6b7280; font-size: 12px; margin: 0;">PO ID</p><p style="font-weight: bold; font-size: 18px; color: #7c3aed; margin: 5px 0;">${formData.poId}</p></div>
                                </div>
                                <div style="background: #eff6ff; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #1e40af; font-weight: 600;">📦 Status</span><span style="background: #3b82f6; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px;">IN PROGRESS</span></div></div>
                                <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #059669; font-weight: 600;">📡 Sensor</span><span style="font-size: 16px; font-weight: bold; color: #059669;">${selectedSensor}</span></div></div>
                                <div style="background: #fef3c7; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #92400e; font-weight: 600;">📏 Area Covered</span><span style="font-size: 22px; font-weight: bold; color: #b45309;">${formData.areaCovered} km²</span></div></div>
                                <div style="background: #fce7f3; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #9f1239; font-weight: 600;">💰 Price Added</span><span style="font-size: 18px; font-weight: bold; color: #be123c;">﷼${(pricePerKm * formData.areaCovered).toFixed(2)}</span></div></div>
                                <div style="background: #e0e7ff; padding: 15px; border-radius: 10px;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;"><span style="color: #3730a3; font-weight: 600;">📊 Total Progress</span><span style="font-size: 24px; font-weight: bold; color: #4338ca;">${newPercentage}%</span></div><div style="width: 100%; height: 12px; background: #c7d2fe; border-radius: 10px; overflow: hidden;"><div style="width: ${Math.min(newPercentage, 100)}%; height: 100%; background: linear-gradient(90deg, #6366f1 0%, #4f46e5 100%);"></div></div></div>
                            </div>
                        </div>
                        <p style="color: #3b82f6; font-size: 16px; font-weight: 600; margin-top: 15px;">✨ Your order is actively being processed!</p>
                    `,
                    confirmButtonColor: '#3b82f6',
                    width: '600px'
                },
                'PARTIALLY_COMPLETED': {
                    icon: 'success',
                    title: '<strong style="color:#1e40af; font-size:26px;">✅ Order Updated Successfully</strong>',
                    html: `
                        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 22px; border-radius: 14px; color: white; margin: 16px 0;">
                            <div style="background: rgba(255,255,255,0.96); padding: 18px; border-radius: 12px; color: #1f2937;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                                    <div><p style="color: #64748b; font-size: 11px; margin: 0;">ORDER ID</p><p style="font-weight: 600; font-size: 16px; color: #0f172a; margin: 4px 0;">${formData.orderId}</p></div>
                                    <div style="text-align:right;"><p style="color: #64748b; font-size: 11px; margin: 0;">PO ID</p><p style="font-weight: 600; font-size: 16px; color: #0f172a; margin: 4px 0;">${formData.poId}</p></div>
                                </div>
                                <div style="background: #eff6ff; padding: 12px; border-radius: 10px; margin-bottom: 10px;"><div style="display:flex; justify-content:space-between; align-items:center;"><span style="color:#1e40af; font-weight:600;">📦 Status</span><span style="background:#2563eb; color:white; padding:5px 14px; border-radius:16px; font-size:12px; font-weight:600;">PARTIALLY COMPLETED</span></div></div>
                                <div style="background: #f0fdf4; padding: 12px; border-radius: 10px; margin-bottom: 10px;"><div style="display:flex; justify-content:space-between; align-items:center;"><span style="color:#065f46; font-weight:600;">📡 Sensor</span><span style="font-size:15px; font-weight:600; color:#065f46;">${selectedSensor}</span></div></div>
                                <div style="background: #fef3c7; padding: 12px; border-radius: 10px; margin-bottom: 10px;"><div style="display:flex; justify-content:space-between; align-items:center;"><span style="color:#92400e; font-weight:600;">📏 Area Covered</span><span style="font-size:18px; font-weight:600; color:#b45309;">${formData.areaCovered} km²</span></div></div>
                                <div style="background: #fce7f3; padding: 12px; border-radius: 10px; margin-bottom: 10px;"><div style="display:flex; justify-content:space-between; align-items:center;"><span style="color:#9f1239; font-weight:600;">💰 Price Added</span><span style="font-size:16px; font-weight:600; color:#be123c;">﷼${(pricePerKm * formData.areaCovered).toFixed(2)}</span></div></div>
                                <div style="background:#f8fafc; padding:12px; border-radius:10px;"><div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span style="color:#475569; font-weight:600;">📊 Total Progress</span><span style="font-weight:600; color:#1e40af;">${newPercentage}%</span></div><div style="width:100%; height:8px; background:#e5e7eb; border-radius:6px;"><div style="width:${Math.min(newPercentage, 100)}%; height:100%; background:#2563eb; border-radius:6px;"></div></div></div>
                            </div>
                        </div>
                        <p style="color:#475569; font-size:14px; margin-top:10px;">Order progress has been updated successfully.</p>
                    `,
                    confirmButtonColor: '#2563eb',
                    confirmButtonText: 'Close',
                    width: '560px'
                },
                'COMPLETED': {
                    icon: 'success',
                    title: '<strong style="color: #059669; font-size: 28px;">🎉 Order Completed!</strong>',
                    html: `
                        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; border-radius: 15px; color: white; margin: 20px 0;">
                            <div style="background: rgba(255,255,255,0.95); padding: 20px; border-radius: 12px; color: #1f2937;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
                                    <div><p style="color: #6b7280; font-size: 12px; margin: 0;">ORDER ID</p><p style="font-weight: bold; font-size: 18px; color: #059669; margin: 5px 0;">${formData.orderId}</p></div>
                                    <div style="text-align: right;"><p style="color: #6b7280; font-size: 12px; margin: 0;">PO ID</p><p style="font-weight: bold; font-size: 18px; color: #10b981; margin: 5px 0;">${formData.poId}</p></div>
                                </div>
                                <div style="background: #d1fae5; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #059669; font-weight: 600;">📦 Status</span><span style="background: #10b981; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px;">✓ COMPLETED</span></div></div>
                                <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #059669; font-weight: 600;">📡 Sensor</span><span style="font-size: 18px; font-weight: bold; color: #059669;">${selectedSensor}</span></div></div>
                                <div style="background: #fef3c7; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #92400e; font-weight: 600;">📏 Area Covered</span><span style="font-size: 22px; font-weight: bold; color: #b45309;">${formData.areaCovered} km²</span></div></div>
                                <div style="background: #fce7f3; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #9f1239; font-weight: 600;">💰 Price Added</span><span style="font-size: 20px; font-weight: bold; color: #be123c;">﷼${(pricePerKm * formData.areaCovered).toFixed(2)}</span></div></div>
                                <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 15px; border-radius: 10px;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;"><span style="color: #065f46; font-weight: 600;">📊 Total Progress</span><span style="font-size: 24px; font-weight: bold; color: #047857;">${newPercentage}%</span></div><div style="width: 100%; height: 12px; background: #a7f3d0; border-radius: 10px; overflow: hidden;"><div style="width: 100%; height: 100%; background: linear-gradient(90deg, #10b981 0%, #059669 100%);"></div></div></div>
                            </div>
                        </div>
                        <p style="color: #10b981; font-size: 16px; font-weight: 600; margin-top: 15px;">🏆 Excellent work! Order completed successfully!</p>
                    `,
                    confirmButtonColor: '#10b981',
                    width: '600px'
                },
                'COMPLETED_WITH_ENHANCEMENTS': {
                    icon: 'success',
                    title: '<strong style="color: #7c3aed; font-size: 28px;">🌟 Completed with Enhancements!</strong>',
                    html: `
                        <div style="background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); padding: 25px; border-radius: 15px; color: white; margin: 20px 0;">
                            <div style="background: rgba(255,255,255,0.95); padding: 20px; border-radius: 12px; color: #1f2937;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
                                    <div><p style="color: #6b7280; font-size: 12px; margin: 0;">ORDER ID</p><p style="font-weight: bold; font-size: 18px; color: #7c3aed; margin: 5px 0;">${formData.orderId}</p></div>
                                    <div style="text-align: right;"><p style="color: #6b7280; font-size: 12px; margin: 0;">PO ID</p><p style="font-weight: bold; font-size: 18px; color: #a855f7; margin: 5px 0;">${formData.poId}</p></div>
                                </div>
                                <div style="background: #f3e8ff; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #6b21a8; font-weight: 600;">📦 Status</span><span style="background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px;">✓ COMPLETED WITH ENHANCEMENTS</span></div></div>
                                ${extraArea > 0 ? `<div style="background: #fef3c7; padding: 15px; border-radius: 10px; margin-bottom: 12px; border-left: 4px solid #f59e0b;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #92400e; font-weight: 600;">🎯 Extra Area Covered</span><span style="font-size: 20px; font-weight: bold; color: #b45309;">${extraArea.toFixed(2)} km²</span></div></div>` : ''}
                                <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #065f46; font-weight: 600;">📡 Sensor</span><span style="font-size: 18px; font-weight: bold; color: #065f46;">${selectedSensor}</span></div></div>
                                <div style="background: #ede9fe; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #5b21b6; font-weight: 600;">📏 Total Area Covered</span><span style="font-size: 22px; font-weight: bold; color: #6b21a8;">${formData.areaCovered} km²</span></div></div>
                                <div style="background: #fce7f3; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #9f1239; font-weight: 600;">💰 Price Added</span><span style="font-size: 20px; font-weight: bold; color: #be123c;">﷼${(pricePerKm * formData.areaCovered).toFixed(2)}</span></div></div>
                                <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); padding: 15px; border-radius: 10px;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;"><span style="color: #6b21a8; font-weight: 600;">📊 Total Progress</span><span style="font-size: 24px; font-weight: bold; color: #7c3aed;">${newPercentage}%</span></div><div style="width: 100%; height: 12px; background: #e9d5ff; border-radius: 10px; overflow: hidden;"><div style="width: 100%; height: 100%; background: linear-gradient(90deg, #a855f7 0%, #7c3aed 100%);"></div></div></div>
                            </div>
                        </div>
                        <p style="color: #a855f7; font-size: 16px; font-weight: 600; margin-top: 15px;">🏆 Outstanding! Order completed with extra coverage!</p>
                    `,
                    confirmButtonColor: '#a855f7',
                    width: '600px'
                },
                'PRODUCTION_FAIL': {
                    icon: 'success',
                    title: '<strong style="color: #dc2626; font-size: 28px;">⛔ Production Failure Recorded</strong>',
                    html: `
                        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 25px; border-radius: 15px; color: white; margin: 20px 0;">
                            <div style="background: rgba(255,255,255,0.95); padding: 20px; border-radius: 12px; color: #1f2937;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
                                    <div><p style="color: #6b7280; font-size: 12px; margin: 0;">ORDER ID</p><p style="font-weight: bold; font-size: 18px; color: #dc2626; margin: 5px 0;">${formData.orderId}</p></div>
                                    <div style="text-align: right;"><p style="color: #6b7280; font-size: 12px; margin: 0;">PO ID</p><p style="font-weight: bold; font-size: 18px; color: #ef4444; margin: 5px 0;">${formData.poId}</p></div>
                                </div>
                                <div style="background: #fee2e2; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #991b1b; font-weight: 600;">📦 Status</span><span style="background: #ef4444; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 13px;">✗ PRODUCTION FAIL</span></div></div>
                                <div style="background: #fef2f2; padding: 15px; border-radius: 10px; margin-bottom: 12px; border-left: 4px solid #dc2626;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #991b1b; font-weight: 600;">📏 Area Covered</span><span style="font-size: 22px; font-weight: bold; color: #dc2626;">0 km²</span></div></div>
                                <div style="background: #fce7f3; padding: 15px; border-radius: 10px; margin-bottom: 12px;"><div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: #9f1239; font-weight: 600;">💰 Price Added</span><span style="font-size: 20px; font-weight: bold; color: #be123c;">﷼0.00</span></div></div>
                                <div style="background: #d1fae5; padding: 15px; border-radius: 10px;">
                                    <p style="color: #059669; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">✓ STATUS UPDATED</p>
                                    <p style="color: #047857; margin: 0; font-size: 13px;">This order has been marked as production failed. No area or price has been added to the record.</p>
                                </div>
                            </div>
                        </div>
                        <p style="color: #059669; font-size: 16px; font-weight: 600; margin-top: 15px;">✓ Status updated successfully.</p>
                    `,
                    confirmButtonColor: '#10b981',
                    width: '600px'
                }
            };

            const config = statusConfig[formData.status] || {
                icon: 'success',
                title: 'Updated!',
                text: 'Order updated successfully!',
                confirmButtonColor: '#3b82f6'
            };

            Swal.fire({
                ...config,
                confirmButtonText: 'OK',
                showClass: { popup: 'animate__animated animate__fadeInDown' },
                hideClass: { popup: 'animate__animated animate__fadeOutUp' }
            });

        } catch (err) {
            const userMessage = err.message || 'Failed to update order';
            setError(userMessage);
            console.error('Order update error:', err);

            Swal.fire({
                icon: 'error',
                title: '<strong style="color: #dc2626; font-size: 28px;">❌ Update Failed</strong>',
                html: `
                    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 25px; border-radius: 15px; color: white; margin: 20px 0;">
                        <div style="background: rgba(255,255,255,0.95); padding: 20px; border-radius: 12px; color: #1f2937;">
                            <div style="background: #fee2e2; padding: 15px; border-radius: 10px; margin-bottom: 12px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 24px;">⚠️</span>
                                    <div style="text-align: left; flex: 1;">
                                        <p style="color: #991b1b; font-weight: 600; margin: 0; font-size: 14px;">ERROR MESSAGE</p>
                                        <p style="color: #dc2626; font-weight: bold; margin: 5px 0 0 0; font-size: 16px;">${userMessage}</p>
                                    </div>
                                </div>
                            </div>
                            <div style="background: #fef2f2; padding: 15px; border-radius: 10px; border-left: 4px solid #ef4444;">
                                <p style="color: #991b1b; font-weight: 600; margin: 0; font-size: 14px;">💡 WHAT TO DO NEXT?</p>
                                <ul style="text-align: left; color: #dc2626; margin: 10px 0 0 0; padding-left: 20px;">
                                    <li>Check your internet connection</li>
                                    <li>Verify the entered data</li>
                                    <li>Contact support if issue persists</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <p style="color: #ef4444; font-size: 16px; font-weight: 600; margin-top: 15px;">🔧 Please try again or contact technical support</p>
                `,
                confirmButtonText: 'OK',
                confirmButtonColor: '#ef4444',
                width: '600px',
                showClass: { popup: 'animate__animated animate__shakeX' }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (returnTo === 'dashboard') {
            history.push('/dashboard');
        } else {
            history.push('/orders');
        }
    };

    if (!orderData) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">
                            {returnTo === 'dashboard' ? 'Back to Dashboard' : 'Back to Orders'}
                        </span>
                    </button>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Edit className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Update Order</h1>
                                    <p className="text-gray-600">{formData.orderId} - {formData.client}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Progress</p>
                                <p className="text-2xl font-bold text-blue-600">{formData.percentageComplete}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Success */}
                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                            <p className="font-medium text-green-800">Order updated successfully!</p>
                            <p className="text-sm text-green-600">Redirecting...</p>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Order Information - READ ONLY */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 pb-3 border-b">
                            <Package className="w-5 h-5 text-blue-600" />
                            Order Information (Read Only)
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Order ID</label>
                                <input name="orderId" value={formData.orderId} disabled className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">PO ID</label>
                                <input name="poId" value={formData.poId} disabled className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium cursor-not-allowed" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                                <input name="client" value={formData.client} disabled className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium cursor-not-allowed" />
                            </div>
                        </div>
                    </div>

                    {/* Area Information - READ ONLY */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 pb-3 border-b">
                            <MapPin className="w-5 h-5 text-purple-600" />
                            Area Information (Read Only)
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Total Area (km²)</label>
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <p className="text-2xl font-bold text-blue-700">{formData.totalArea}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Collected Area (km²)</label>
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <p className="text-2xl font-bold text-green-700">{formData.collectedArea}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Remaining Area (km²)</label>
                                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                    <p className="text-2xl font-bold text-orange-700">
                                        {formData.remainingArea >= 0
                                            ? formData.remainingArea
                                            : `+${Math.abs(formData.remainingArea)} Extra`}
                                    </p>
                                    {formData.remainingArea < 0 && (
                                        <p className="text-xs text-green-600 font-semibold mt-1">✨ Extra area covered beyond target</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span className="font-medium">Current Progress</span>
                                <span className="font-bold text-gray-900">{formData.percentageComplete}%</span>
                            </div>
                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${formData.percentageComplete >= 100
                                        ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                                        : formData.percentageComplete > 50
                                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                        }`}
                                    style={{ width: `${Math.min(formData.percentageComplete, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── SENSOR SECTION ─────────────────────────────────────────────────── */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <Package className="w-5 h-5 text-green-600" />
                                Select Sensor {formData.status !== 'PRODUCTION_FAIL' && <span className="text-red-500 text-sm">*</span>}
                            </h2>

                            {/* Add sensor toggle button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddSensor((prev) => !prev);
                                    setAddSensorError('');
                                    setNewSensorName('');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showAddSensor
                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                            >
                                {showAddSensor ? (
                                    <><X className="w-4 h-4" /> Cancel</>
                                ) : (
                                    <><Plus className="w-4 h-4" /> Add Sensor</>
                                )}
                            </button>
                        </div>

                        {/* ── Inline Add-Sensor Form ── */}
                        {showAddSensor && (
                            <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <p className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Add a Sensor
                                </p>
                                <div className="flex gap-3">
                                    <select
                                        value={newSensorName}
                                        onChange={(e) => {
                                            setNewSensorName(e.target.value);
                                            setAddSensorError('');
                                        }}
                                        className="flex-1 px-4 py-2.5 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                                        autoFocus
                                    >
                                        <option value="">-- Select a Sensor --</option>
                                        {Array.from({ length: 20 }, (_, i) => `Sensor ${i + 1}`)
                                            .filter(s => !sensors.includes(s))
                                            .map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))
                                        }
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddSensor}
                                        className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-all flex items-center gap-1.5 shadow"
                                    >
                                        <Plus className="w-4 h-4" /> Add & Select
                                    </button>
                                </div>
                                {addSensorError && (
                                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5" /> {addSensorError}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ── Sensor Grid ── */}
                        {sensors.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {sensors.map((sensor, index) => (
                                    <div key={index} className="relative group">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedSensor(sensor)}
                                            className={`w-full p-3 rounded-lg border-2 transition-all font-semibold text-sm pr-8 ${selectedSensor === sensor
                                                ? 'bg-green-500 text-white border-green-600 shadow-lg scale-105'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-green-400 hover:bg-green-50'
                                                }`}
                                        >
                                            {sensor}
                                        </button>

                                        {/* Remove button — only on custom (non-original) sensors OR always shown on hover */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSensor(sensor)}
                                            title="Remove sensor"
                                            className="absolute top-1 right-1 p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-yellow-800 text-sm">
                                    No sensors available. Use <strong>Add Sensor</strong> above to create one.
                                </p>
                            </div>
                        )}

                        {/* Selected sensor badge */}
                        {selectedSensor && (
                            <div className="mt-4 bg-green-50 rounded-lg p-3 border border-green-200">
                                <p className="text-sm text-green-800 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="font-medium">Selected Sensor:</span> {selectedSensor}
                                    {isTaskingOrder ? (
                                        <span className="ml-2 text-xs bg-red-200 text-red-800 px-2 py-1 rounded font-semibold">
                                            Tasking - ﷼{SENSOR_PRICE_TASKING[selectedSensor]}/km²
                                        </span>
                                    ) : isTaskingArchive && selectedTaskingType ? (
                                        <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded font-semibold">
                                            {selectedTaskingType} - ﷼{getPriceForSensor(selectedSensor, selectedTaskingType)}/km²
                                        </span>
                                    ) : !isTaskingArchive ? (
                                        <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded font-semibold">
                                            Archive - ﷼{SENSOR_PRICE_ARCHIVE[selectedSensor]}/km²
                                        </span>
                                    ) : null}
                                </p>
                            </div>
                        )}
                    </div>
                    {/* ── END SENSOR SECTION ─────────────────────────────────────────────── */}

                    {/* ── TASKING/ARCHIVE SECTION ─────────────────────────────────────────── */}
                    {isTaskingArchive && formData.status !== 'PRODUCTION_FAIL' && (
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 pb-3 border-b">
                                <Package className="w-5 h-5 text-purple-600" />
                                Select Type <span className="text-red-500 text-sm">*</span>
                            </h2>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTaskingType('Archive')}
                                    className={`p-6 rounded-lg border-2 transition-all font-semibold text-center ${
                                        selectedTaskingType === 'Archive'
                                            ? 'bg-purple-500 text-white border-purple-600 shadow-lg scale-105'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                                    }`}
                                >
                                    <div className="text-2xl mb-2">📦</div>
                                    <div className="text-lg">Archive</div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedTaskingType('Tasking')}
                                    className={`p-6 rounded-lg border-2 transition-all font-semibold text-center ${
                                        selectedTaskingType === 'Tasking'
                                            ? 'bg-blue-500 text-white border-blue-600 shadow-lg scale-105'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                    }`}
                                >
                                    <div className="text-2xl mb-2">✓</div>
                                    <div className="text-lg">Tasking</div>
                                </button>
                            </div>

                            {/* Selected type badge */}
                            {selectedTaskingType && (
                                <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
                                    <p className="text-sm text-gray-800 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="font-medium">Selected Type:</span>
                                        <span className={`font-bold px-3 py-1 rounded-full text-white text-sm ${
                                            selectedTaskingType === 'Archive' ? 'bg-purple-500' : 'bg-blue-500'
                                        }`}>
                                            {selectedTaskingType}
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    {/* ── END TASKING/ARCHIVE SECTION ───────────────────────────────────── */}

                    {/* EDITABLE SECTION - Status, Area Covered & Price */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-blue-300">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-blue-300">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Update Order Details
                        </h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium bg-white"
                                >
                                    <option value="">Select Status</option>
                                    {STATUSES.map(s => (
                                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Area Covered (km²) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="areaCovered"
                                    value={formData.areaCovered}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    disabled={formData.status === 'PRODUCTION_FAIL'}
                                    className={`w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium ${
                                        formData.status === 'PRODUCTION_FAIL'
                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                            : 'bg-white'
                                    }`}
                                    placeholder="Enter area covered"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                    Price per km² <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={pricePerKm}
                                    onChange={(e) => setPricePerKm(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                    step="0.01"
                                    required
                                    disabled={formData.status === 'PRODUCTION_FAIL'}
                                    className={`w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium ${
                                        formData.status === 'PRODUCTION_FAIL'
                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                            : 'bg-white'
                                    }`}
                                    placeholder="Enter price per km²"
                                />
                                <div className="mt-2 flex justify-between items-center">
                                    <p className="text-xs text-gray-600">
                                        {isTaskingOrder && selectedSensor
                                            ? `Price for ${selectedSensor} (Tasking): ﷼${pricePerKm}`
                                            : isTaskingArchive && selectedSensor && selectedTaskingType
                                            ? `Price for ${selectedSensor} (${selectedTaskingType}): ﷼${pricePerKm}`
                                            : !isTaskingArchive && selectedSensor
                                            ? `Price for ${selectedSensor} (Archive): ﷼${pricePerKm}`
                                            : `Default: ﷼${defaultPricePerKm.toFixed(2)} per km²`
                                        }
                                    </p>
                                    <p className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
                                        Total: ﷼{(pricePerKm * formData.areaCovered).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-900 mb-2">Comment / Remarks</label>
                                <textarea
                                    name="comment"
                                    value={formData.comment}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="Enter comments about this update..."
                                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                                />
                            </div>
                        </div>

                        <div className={`mt-4 rounded-lg p-3 border ${
                            formData.status === 'PRODUCTION_FAIL'
                                ? 'bg-red-50 border-red-300'
                                : 'bg-blue-100 border-blue-300'
                        }`}>
                            <p className={`text-sm flex items-center gap-2 ${
                                formData.status === 'PRODUCTION_FAIL'
                                    ? 'text-red-800'
                                    : 'text-blue-800'
                            }`}>
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-medium">
                                    {formData.status === 'PRODUCTION_FAIL'
                                        ? 'Production Fail Mode: Area and Price are auto-set to 0 and cannot be edited.'
                                        : 'Note: Status, Area Covered, Price per km², and Sensor selection are editable. Price auto-adjusts when you select a sensor but can be modified anytime. Area can exceed remaining area if needed.'
                                    }
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <><Loader className="w-5 h-5 animate-spin" /> Updating...</>
                            ) : (
                                <><Save className="w-5 h-5" /> Save Changes</>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                        >
                            <X className="w-5 h-5" /> Cancel
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default withRouter(OrderUpdate);
